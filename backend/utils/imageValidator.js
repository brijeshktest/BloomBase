const sharp = require('sharp');
const path = require('path');

// Image specifications
const IMAGE_SPECS = {
  logo: {
    minWidth: 256,
    maxWidth: 2048,
    minHeight: 256,
    maxHeight: 2048,
    minAspectRatio: 0.9, // Allow slight variation
    maxAspectRatio: 1.1,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    description: 'Logo must be square (256x256 to 2048x2048 pixels, max 2MB)'
  },
  banner: {
    minWidth: 1200,
    maxWidth: 3840,
    minHeight: 250,
    maxHeight: 800,
    minAspectRatio: 4.0, // 4:1
    maxAspectRatio: 6.0, // 6:1
    maxFileSize: 5 * 1024 * 1024, // 5MB
    description: 'Banner must be 1200x250 to 3840x800 pixels with aspect ratio between 4:1 and 6:1 (max 5MB)'
  },
  product: {
    minWidth: 400,
    maxWidth: 2400,
    minHeight: 400,
    maxHeight: 2400,
    minAspectRatio: 0.9, // Near square
    maxAspectRatio: 1.1,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    description: 'Product images must be square (400x400 to 2400x2400 pixels, max 5MB)'
  }
};

/**
 * Validate image dimensions and aspect ratio
 * @param {string} filePath - Path to the image file
 * @param {string} type - Type of image: 'logo', 'banner', or 'product'
 * @returns {Promise<{valid: boolean, error?: string, metadata?: object}>}
 */
async function validateImage(filePath, type) {
  try {
    const spec = IMAGE_SPECS[type];
    if (!spec) {
      return { valid: false, error: `Invalid image type: ${type}` };
    }

    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    const { width, height, size } = metadata;
    const aspectRatio = width / height;

    // Check file size
    if (size > spec.maxFileSize) {
      return {
        valid: false,
        error: `File size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${spec.maxFileSize / 1024 / 1024}MB)`
      };
    }

    // Check dimensions
    if (width < spec.minWidth || width > spec.maxWidth) {
      return {
        valid: false,
        error: `Width (${width}px) must be between ${spec.minWidth}px and ${spec.maxWidth}px`
      };
    }

    if (height < spec.minHeight || height > spec.maxHeight) {
      return {
        valid: false,
        error: `Height (${height}px) must be between ${spec.minHeight}px and ${spec.maxHeight}px`
      };
    }

    // Check aspect ratio
    if (aspectRatio < spec.minAspectRatio || aspectRatio > spec.maxAspectRatio) {
      return {
        valid: false,
        error: `Aspect ratio (${aspectRatio.toFixed(2)}) is outside allowed range (${spec.minAspectRatio} to ${spec.maxAspectRatio}). ${spec.description}`
      };
    }

    return {
      valid: true,
      metadata: {
        width,
        height,
        size,
        aspectRatio,
        format: metadata.format
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to process image: ${error.message}`
    };
  }
}

/**
 * Get image specifications for a type
 */
function getImageSpecs(type) {
  return IMAGE_SPECS[type] || null;
}

/**
 * Get all image specifications
 */
function getAllSpecs() {
  return IMAGE_SPECS;
}

module.exports = {
  validateImage,
  getImageSpecs,
  getAllSpecs,
  IMAGE_SPECS
};
