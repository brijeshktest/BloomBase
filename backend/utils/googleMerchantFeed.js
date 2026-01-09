const Product = require('../models/Product');
const User = require('../models/User');

/**
 * Generate Google Merchant Center XML feed for a seller
 * @param {string} sellerId - MongoDB ObjectId of the seller
 * @param {string} baseUrl - Base URL of the application (e.g., https://selllocalonline.com)
 * @returns {Promise<string>} XML feed string
 */
async function generateGoogleMerchantFeed(sellerId, baseUrl = 'https://selllocalonline.com') {
  try {
    // Get seller information
    const seller = await User.findById(sellerId).select('businessName alias isActive isApproved');
    
    if (!seller || !seller.isActive || !seller.isApproved) {
      throw new Error('Seller not found or not active');
    }

    // Get all active products for this seller
    const products = await Product.find({
      seller: sellerId,
      isActive: true,
      stock: { $gt: 0 } // Only include products with stock > 0
    }).sort({ createdAt: -1 });

    if (products.length === 0) {
      // Return empty feed with header
      return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(seller.businessName || 'Store')} - Google Merchant Feed</title>
    <link>${baseUrl}/store/${seller.alias}</link>
    <description>Product feed for ${escapeXml(seller.businessName || 'Store')}</description>
  </channel>
</rss>`;
    }

    // Build XML feed
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(seller.businessName || 'Store')} - Google Merchant Feed</title>
    <link>${baseUrl}/store/${seller.alias}</link>
    <description>Product feed for ${escapeXml(seller.businessName || 'Store')}</description>
`;

    // Add each product as an item
    for (const product of products) {
      const productUrl = `${baseUrl}/store/${seller.alias}/product/${product.slug}`;
      
      // Get main image (first image from array)
      let imageLink = '';
      let additionalImages = [];
      
      if (product.images && product.images.length > 0) {
        // Filter out base64 images (Google doesn't accept them)
        const httpImages = product.images.filter(img => 
          img && (img.startsWith('http://') || img.startsWith('https://'))
        );
        
        if (httpImages.length > 0) {
          imageLink = httpImages[0];
          // Additional images (up to 10 more)
          additionalImages = httpImages.slice(1, 11);
        }
      }

      // If no HTTP image, try to construct from uploaded file path
      if (!imageLink && product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        if (firstImage && !firstImage.startsWith('data:image/')) {
          // Check if it's already a full path starting with /uploads
          if (firstImage.startsWith('/uploads/')) {
            imageLink = `${baseUrl}${firstImage}`;
          } else if (!firstImage.startsWith('http://') && !firstImage.startsWith('https://')) {
            // Assume it's a filename, construct full URL
            imageLink = `${baseUrl}/uploads/products/images/${firstImage}`;
          }
        }
      }

      // Skip products without valid images (Google requirement)
      if (!imageLink) {
        continue;
      }

      // Determine availability
      let availability = 'in stock';
      if (product.stock === 0) {
        availability = 'out of stock';
      } else if (product.stock < 10) {
        availability = 'limited availability';
      }

      // Get price (use basePrice, Google requires price for minimum order quantity)
      const price = product.basePrice;
      const priceWithCurrency = `${price.toFixed(2)} INR`;

      // Build product description (limit to 5000 chars for Google)
      let description = product.description || product.name;
      if (description.length > 5000) {
        description = description.substring(0, 4997) + '...';
      }

      // Build item XML
      xml += `    <item>
      <g:id>${escapeXml(product._id.toString())}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
`;

      // Add additional images
      for (const additionalImage of additionalImages) {
        xml += `      <g:additional_image_link>${escapeXml(additionalImage)}</g:additional_image_link>
`;
      }

      xml += `      <g:price>${escapeXml(priceWithCurrency)}</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(seller.businessName || 'Generic')}</g:brand>
      <g:product_type>${escapeXml(product.category)}</g:product_type>
`;

      // Add category as Google product category if available
      if (product.category) {
        xml += `      <g:google_product_category>${escapeXml(product.category)}</g:google_product_category>
`;
      }

      // Add minimum order quantity in description or custom label
      if (product.minimumOrderQuantity > 1) {
        xml += `      <g:custom_label_0>Min Qty: ${product.minimumOrderQuantity}</g:custom_label_0>
`;
      }

      // Add stock quantity
      if (product.stock) {
        xml += `      <g:quantity>${product.stock}</g:quantity>
`;
      }

      // Add unit
      if (product.unit && product.unit !== 'piece') {
        xml += `      <g:unit_pricing_measure>1 ${product.unit}</g:unit_pricing_measure>
`;
      }

      xml += `    </item>
`;
    }

    xml += `  </channel>
</rss>`;

    return xml;
  } catch (error) {
    console.error('Error generating Google Merchant feed:', error);
    throw error;
  }
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Get feed URL for a seller
 * @param {string} sellerId - MongoDB ObjectId of the seller
 * @param {string} baseUrl - Base URL of the application
 * @returns {string} Feed URL
 */
function getFeedUrl(sellerId, baseUrl = 'https://selllocalonline.com') {
  return `${baseUrl}/api/merchant-feed/${sellerId}/feed.xml`;
}

module.exports = {
  generateGoogleMerchantFeed,
  getFeedUrl,
  escapeXml
};
