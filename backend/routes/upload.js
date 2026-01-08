const express = require('express');
const { protect, sellerOnly, checkTrial } = require('../middleware/auth');
const upload = require('../utils/upload');
const User = require('../models/User');
const { validateImage } = require('../utils/imageValidator');
const path = require('path');

const router = express.Router();

// Test endpoint to verify routes are loaded
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Upload routes are working',
    availableRoutes: ['/logo', '/banner', '/seller-video']
  });
});

// Upload seller logo
router.post('/logo', protect, sellerOnly, checkTrial, (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'File too large', 
          error: 'Logo image must be less than 2MB. Recommended: 512x512px' 
        });
      }
      if (err.message && err.message.includes('Only image files')) {
        return res.status(400).json({ 
          message: 'Invalid file type', 
          error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' 
        });
      }
      return res.status(400).json({ message: 'Upload error', error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select a file.' });
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

// Upload seller banner - handle multer errors properly
const bannerUpload = upload.single('banner');
router.post('/banner', protect, sellerOnly, checkTrial, (req, res, next) => {
  bannerUpload(req, res, (err) => {
    if (err) {
      console.error('Multer error in banner upload:', err);
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'File too large', 
          error: 'Banner image must be less than 5MB. Recommended: 1920x400px' 
        });
      }
      if (err.message && err.message.includes('Only image files')) {
        return res.status(400).json({ 
          message: 'Invalid file type', 
          error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' 
        });
      }
      return res.status(400).json({ message: 'Upload error', error: err.message || 'Unknown upload error' });
    }
    // No error, continue to handler
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file in banner upload request');
      return res.status(400).json({ message: 'No file uploaded. Please select a file.' });
    }

    console.log('Banner file received:', { 
      filename: req.file.originalname, 
      size: req.file.size, 
      mimetype: req.file.mimetype 
    });

    // Validate image dimensions
    const filePath = path.join(__dirname, '..', req.file.path);
    const validation = await validateImage(filePath, 'banner');
    
    if (!validation.valid) {
      // Delete invalid file
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
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
    console.error('Banner upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload seller video (story/vision video) - handle multer errors properly
const sellerVideoUpload = upload.single('sellerVideo');
router.post('/seller-video', protect, sellerOnly, checkTrial, (req, res, next) => {
  sellerVideoUpload(req, res, (err) => {
    if (err) {
      console.error('Multer error in seller video upload:', err);
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'File too large', 
          error: 'Video file must be less than 100MB' 
        });
      }
      if (err.message && err.message.includes('Only video files')) {
        return res.status(400).json({ 
          message: 'Invalid file type', 
          error: 'Only video files (MP4, WebM, MOV, AVI) are allowed' 
        });
      }
      return res.status(400).json({ message: 'Upload error', error: err.message || 'Unknown upload error' });
    }
    // No error, continue to handler
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      console.error('No file in seller video upload request');
      return res.status(400).json({ message: 'No file uploaded. Please select a file.' });
    }

    console.log('Seller video file received:', { 
      filename: req.file.originalname, 
      size: req.file.size, 
      mimetype: req.file.mimetype 
    });

    // Validate video file
    const videoTypes = /mp4|webm|mov|avi/;
    const extname = path.extname(req.file.originalname).toLowerCase().slice(1);
    
    if (!videoTypes.test(extname)) {
      const fs = require('fs');
      fs.unlinkSync(path.join(__dirname, '..', req.file.path));
      return res.status(400).json({ 
        message: 'Invalid video format',
        error: 'Only MP4, WebM, MOV, and AVI video files are allowed (max 100MB)'
      });
    }

    // Check file size (100MB max)
    if (req.file.size > 100 * 1024 * 1024) {
      const fs = require('fs');
      fs.unlinkSync(path.join(__dirname, '..', req.file.path));
      return res.status(400).json({ 
        message: 'File too large',
        error: 'Video file must be less than 100MB'
      });
    }

    const videoPath = `/uploads/sellers/videos/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user._id, { sellerVideo: videoPath });

    res.json({ 
      message: 'Video uploaded successfully',
      path: videoPath,
      size: req.file.size
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

