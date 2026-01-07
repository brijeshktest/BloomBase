const express = require('express');
const { protect, sellerOnly, checkTrial } = require('../middleware/auth');
const upload = require('../utils/upload');
const User = require('../models/User');
const { validateImage } = require('../utils/imageValidator');
const path = require('path');

const router = express.Router();

// Upload seller logo
router.post('/logo', protect, sellerOnly, checkTrial, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate image dimensions
    const filePath = path.join(__dirname, '..', req.file.path);
    const validation = await validateImage(filePath, 'logo');
    
    if (!validation.valid) {
      // Delete invalid file
      const fs = require('fs');
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: 'Logo validation failed', 
        error: validation.error,
        requirements: 'Logo must be square (256x256 to 2048x2048 pixels, max 2MB)'
      });
    }

    const logoPath = `/uploads/sellers/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user._id, { businessLogo: logoPath });

    res.json({ 
      message: 'Logo uploaded successfully',
      path: logoPath,
      dimensions: {
        width: validation.metadata.width,
        height: validation.metadata.height
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload seller banner
router.post('/banner', protect, sellerOnly, checkTrial, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate image dimensions
    const filePath = path.join(__dirname, '..', req.file.path);
    const validation = await validateImage(filePath, 'banner');
    
    if (!validation.valid) {
      // Delete invalid file
      const fs = require('fs');
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: 'Banner validation failed', 
        error: validation.error,
        requirements: 'Banner must be 1200x250 to 3840x800 pixels with aspect ratio between 4:1 and 6:1 (max 5MB). Recommended: 1920x400px'
      });
    }

    const bannerPath = `/uploads/sellers/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user._id, { businessBanner: bannerPath });

    res.json({ 
      message: 'Banner uploaded successfully',
      path: bannerPath,
      dimensions: {
        width: validation.metadata.width,
        height: validation.metadata.height
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

