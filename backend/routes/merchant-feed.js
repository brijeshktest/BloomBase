const express = require('express');
const { generateGoogleMerchantFeed, getFeedUrl } = require('../utils/googleMerchantFeed');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, sellerOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/merchant-feed/my-feed-url
 * Get the feed URL for the authenticated seller
 * IMPORTANT: This route must come before /:sellerId/feed.xml to avoid route conflicts
 */
router.get('/my-feed-url', protect, sellerOnly, async (req, res) => {
  try {
    const sellerId = req.user._id; // Keep as ObjectId for MongoDB queries
    const sellerIdString = sellerId.toString(); // Use string for URL generation
    
    // Get base URL
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;

    const feedUrl = getFeedUrl(sellerIdString, baseUrl);

    // Get product count for info
    const productCount = await Product.countDocuments({
      seller: sellerId,
      isActive: true,
      stock: { $gt: 0 }
    });

    res.json({
      feedUrl,
      productCount,
      instructions: {
        step1: 'Copy the feed URL above',
        step2: 'Go to Google Merchant Center (merchants.google.com)',
        step3: 'Navigate to Products > Feeds',
        step4: 'Click "+" to add a new feed',
        step5: 'Select "Scheduled fetch"',
        step6: 'Paste your feed URL and set fetch frequency (recommended: daily)',
        step7: 'Save and wait for Google to process your feed'
      }
    });
  } catch (error) {
    console.error('Error getting feed URL:', error);
    res.status(500).json({ message: 'Error generating feed URL', error: error.message });
  }
});

/**
 * GET /api/merchant-feed/feed-info
 * Get feed information including product count and validation status
 * IMPORTANT: This route must come before /:sellerId/feed.xml to avoid route conflicts
 */
router.get('/feed-info', protect, sellerOnly, async (req, res) => {
  try {
    // Validate user and seller ID
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const sellerId = req.user._id; // Keep as ObjectId for MongoDB queries
    const sellerIdString = sellerId.toString(); // Use string for URL generation
    
    // Get base URL
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;

    const feedUrl = getFeedUrl(sellerIdString, baseUrl);

    // Get product statistics
    const totalProducts = await Product.countDocuments({
      seller: sellerId,
      isActive: true
    });

    const productsWithStock = await Product.countDocuments({
      seller: sellerId,
      isActive: true,
      stock: { $gt: 0 }
    });

    // Count products with images (using aggregation or find)
    const productsWithImagesArray = await Product.find({
      seller: sellerId,
      isActive: true,
      stock: { $gt: 0 },
      images: { $exists: true, $ne: [] }
    }).select('images');
    
    const productsWithImages = productsWithImagesArray.filter(p => 
      p.images && Array.isArray(p.images) && p.images.length > 0
    ).length;

    // Check if seller has valid images (HTTP/HTTPS URLs, not base64)
    const products = await Product.find({
      seller: sellerId,
      isActive: true,
      stock: { $gt: 0 }
    }).select('images');

    let productsWithValidImages = 0;
    for (const product of products) {
      if (product.images && product.images.length > 0) {
        const hasValidImage = product.images.some(img => 
          img && (img.startsWith('http://') || img.startsWith('https://'))
        );
        if (hasValidImage) {
          productsWithValidImages++;
        }
      }
    }

    res.json({
      feedUrl,
      statistics: {
        totalProducts: totalProducts || 0,
        productsWithStock: productsWithStock || 0,
        productsWithImages: productsWithValidImages || 0,
        productsInFeed: productsWithValidImages || 0 // Only products with valid HTTP images are included
      },
      requirements: {
        validImages: 'Products must have HTTP/HTTPS image URLs (not base64) to appear in feed',
        stock: 'Products must have stock > 0 to appear in feed',
        active: 'Only active products are included'
      }
    });
  } catch (error) {
    console.error('Error getting feed info:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error getting feed information', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/merchant-feed/:sellerId/feed.xml
 * Public endpoint to serve Google Merchant Center XML feed
 * This must come last to avoid matching specific routes like /feed-info
 */
router.get('/:sellerId/feed.xml', async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // Get base URL from request or use default
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;

    // Generate feed
    const feedXml = await generateGoogleMerchantFeed(sellerId, baseUrl);

    // Set appropriate headers for XML feed
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(feedXml);
  } catch (error) {
    console.error('Error serving merchant feed:', error);
    res.status(500).set('Content-Type', 'application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <error>${error.message}</error>
  </channel>
</rss>`
    );
  }
});

module.exports = router;
