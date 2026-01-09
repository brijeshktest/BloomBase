/**
 * Image SEO Utility - "The Lens Optimizer"
 * 
 * Automatically generates alt-text, compresses images, and extracts context metadata
 * to help images appear in Google Image Search and Google Lens results.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Compress an image while maintaining quality
 * @param {String} imagePath - Path to the image file
 * @param {Object} options - Compression options
 * @returns {Promise<Object>} Compression result with new path and size info
 */
async function compressImage(imagePath, options = {}) {
  try {
    const {
      quality = 85,
      maxWidth = 1920,
      maxHeight = 1920,
      format = 'webp' // WebP provides better compression
    } = options;

    const ext = path.extname(imagePath).toLowerCase();
    const baseName = path.basename(imagePath, ext);
    const dir = path.dirname(imagePath);
    
    // Get original file size
    const originalStats = fs.statSync(imagePath);
    const originalSize = originalStats.size;

    // Generate compressed filename
    const compressedPath = path.join(dir, `${baseName}_compressed.${format === 'webp' ? 'webp' : ext.slice(1)}`);

    // Compress and resize image
    await sharp(imagePath)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toFile(compressedPath);

    // Get compressed file size
    const compressedStats = fs.statSync(compressedPath);
    const compressedSize = compressedStats.size;

    // If compressed version is larger, keep original
    if (compressedSize >= originalSize) {
      if (fs.existsSync(compressedPath)) {
        fs.unlinkSync(compressedPath);
      }
      return {
        path: imagePath,
        compressed: false,
        originalSize,
        compressedSize: originalSize,
        saved: 0
      };
    }

    // Keep compressed version, remove original to save space
    // Note: In production, you might want to keep both for backup
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    return {
      path: compressedPath,
      compressed: true,
      originalSize,
      compressedSize,
      saved: originalSize - compressedSize,
      savingsPercent: ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Image compression error:', error);
    // Return original if compression fails
    if (fs.existsSync(imagePath)) {
      const originalStats = fs.statSync(imagePath);
      return {
        path: imagePath,
        compressed: false,
        originalSize: originalStats.size,
        compressedSize: originalStats.size,
        error: error.message
      };
    }
    // If file doesn't exist, return error
    return {
      path: imagePath,
      compressed: false,
      originalSize: 0,
      compressedSize: 0,
      error: 'File not found: ' + error.message
    };
  }
}

/**
 * Generate alt-text from product information
 * @param {Object} product - Product object
 * @param {String} imageUrl - Image URL/path
 * @param {Number} imageIndex - Index of image in product images array
 * @returns {String} Generated alt-text
 */
function generateAltText(product, imageUrl, imageIndex = 0) {
  const { name, category, description } = product;
  
  // Base alt-text from product name and category
  let altText = `${name}`;
  
  if (category) {
    altText += ` - ${category}`;
  }
  
  // Add context if available
  if (description) {
    // Extract key descriptive words from description (first 50 chars)
    const descWords = description.toLowerCase().split(/\s+/).slice(0, 10).join(' ');
    if (descWords.length > 0 && descWords.length < 30) {
      altText += `, ${descWords}`;
    }
  }
  
  // Add image position if multiple images
  // if (product.images && product.images.length > 1) {
  //   altText += ` (Image ${imageIndex + 1})`;
  // }
  
  // Limit to 125 characters (recommended for SEO)
  if (altText.length > 125) {
    altText = altText.substring(0, 122) + '...';
  }
  
  return altText;
}

/**
 * Extract image context metadata using AI/ML (placeholder for future implementation)
 * For now, uses product information to infer context
 * @param {Object} product - Product object
 * @param {String} imageUrl - Image URL/path
 * @returns {Promise<Object>} Context metadata
 */
async function extractImageContext(product, imageUrl) {
  const { name, category, description, tags } = product;
  
  // Extract location from seller address if available
  // This would be passed from the product creation route
  const location = product.sellerLocation || '';
  
  // Infer object type from product name and category
  const object = name || category || 'Product';
  
  // Infer occasion from tags or category
  let occasion = '';
  const occasionKeywords = {
    birthday: ['birthday', 'cake', 'party', 'celebration'],
    wedding: ['wedding', 'bridal', 'marriage'],
    festival: ['festival', 'diwali', 'holi', 'christmas', 'eid'],
    gift: ['gift', 'present', 'anniversary']
  };
  
  const searchText = `${name} ${category} ${description} ${tags?.join(' ') || ''}`.toLowerCase();
  
  for (const [occ, keywords] of Object.entries(occasionKeywords)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      occasion = occ;
      break;
    }
  }
  
  // Infer style from category and description
  let style = '';
  const styleKeywords = {
    modern: ['modern', 'contemporary', 'sleek'],
    traditional: ['traditional', 'classic', 'vintage'],
    handmade: ['handmade', 'artisan', 'craft'],
    designer: ['designer', 'premium', 'luxury']
  };
  
  for (const [st, keywords] of Object.entries(styleKeywords)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      style = st;
      break;
    }
  }
  
  // Extract color from description (basic extraction)
  let color = '';
  const colorKeywords = ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange', 'black', 'white', 'brown', 'gray', 'gold', 'silver'];
  for (const col of colorKeywords) {
    if (searchText.includes(col)) {
      color = col;
      break;
    }
  }
  
  return {
    object,
    occasion: occasion || undefined,
    location: location || undefined,
    style: style || undefined,
    color: color || undefined
  };
}

/**
 * Process image with full Lens Optimizer pipeline
 * @param {String} imagePath - Path to the image file
 * @param {Object} product - Product object
 * @param {Number} imageIndex - Index of image in product images array
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Complete image metadata
 */
async function processImageForSEO(imagePath, product, imageIndex = 0, options = {}) {
  try {
    // Step 1: Compress image
    const compressionResult = await compressImage(imagePath, options);
    
    // Step 2: Generate alt-text
    const altText = generateAltText(product, compressionResult.path, imageIndex);
    
    // Step 3: Extract context metadata
    const context = await extractImageContext(product, compressionResult.path);
    
    return {
      url: compressionResult.path,
      altText,
      context,
      compressed: compressionResult.compressed,
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      savingsPercent: compressionResult.savingsPercent
    };
  } catch (error) {
    console.error('Image SEO processing error:', error);
    // Return basic metadata even if processing fails
    return {
      url: imagePath,
      altText: generateAltText(product, imagePath, imageIndex),
      context: {},
      compressed: false,
      error: error.message
    };
  }
}

/**
 * Process multiple images for a product
 * @param {Array<String>} imagePaths - Array of image paths
 * @param {Object} product - Product object
 * @param {Object} options - Processing options
 * @returns {Promise<Array<Object>>} Array of image metadata
 */
async function processImagesForSEO(imagePaths, product, options = {}) {
  const results = await Promise.all(
    imagePaths.map((imagePath, index) => 
      processImageForSEO(imagePath, product, index, options)
    )
  );
  
  return results;
}

module.exports = {
  compressImage,
  generateAltText,
  extractImageContext,
  processImageForSEO,
  processImagesForSEO
};
