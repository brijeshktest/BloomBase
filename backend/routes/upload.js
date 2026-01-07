const express = require('express');
const { protect, sellerOnly, checkTrial } = require('../middleware/auth');
const upload = require('../utils/upload');
const User = require('../models/User');

const router = express.Router();

// Upload seller logo
router.post('/logo', protect, sellerOnly, checkTrial, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const logoPath = `/uploads/sellers/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user._id, { businessLogo: logoPath });

    res.json({ 
      message: 'Logo uploaded successfully',
      path: logoPath
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

    const bannerPath = `/uploads/sellers/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user._id, { businessBanner: bannerPath });

    res.json({ 
      message: 'Banner uploaded successfully',
      path: bannerPath
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

