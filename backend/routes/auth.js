const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { createSlug } = require('../utils/slugify');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register Seller
router.post('/register/seller', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('phone').trim().notEmpty(),
  body('businessName').trim().notEmpty(),
  body('theme').optional().isIn(['ocean', 'sunset', 'forest', 'midnight', 'rose', 'minimal'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, phone, businessName, theme, businessDescription, address } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create unique alias from business name
    let alias = createSlug(businessName);
    let counter = 0;
    while (await User.findOne({ alias })) {
      counter++;
      alias = `${createSlug(businessName)}-${counter}`;
    }

    const seller = await User.create({
      email,
      password,
      name,
      phone,
      role: 'seller',
      businessName,
      alias,
      theme: theme || 'minimal',
      businessDescription,
      address,
      isApproved: false
    });

    // Send WhatsApp notification to admin (construct URL for manual notification)
    const adminPhone = process.env.ADMIN_PHONE;
    const sellerPhone = phone.replace(/\+/g, '');
    const whatsappMessage = encodeURIComponent(`New seller registration!\n\nName: ${name}\nBusiness: ${businessName}\nEmail: ${email}\nPhone: ${phone}\n\nPlease review and approve on BloomBase admin panel.`);
    
    console.log(`WhatsApp notification URL: https://wa.me/${adminPhone.replace(/\+/g, '')}?text=${whatsappMessage}`);

    res.status(201).json({
      message: 'Registration successful! Please wait for admin approval.',
      seller: {
        id: seller._id,
        email: seller.email,
        name: seller.name,
        businessName: seller.businessName,
        alias: seller.alias
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register Buyer (on seller's microsite)
router.post('/register/buyer', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('sellerAlias').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, phone, sellerAlias } = req.body;

    // Find seller
    const seller = await User.findOne({ alias: sellerAlias, role: 'seller', isActive: true });
    if (!seller) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const buyer = await User.create({
      email,
      password,
      name,
      phone,
      role: 'buyer',
      registeredOnSeller: seller._id,
      isApproved: true,
      isActive: true
    });

    const token = generateToken(buyer._id);

    res.status(201).json({
      token,
      user: {
        id: buyer._id,
        email: buyer.email,
        name: buyer.name,
        role: buyer.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessName: user.businessName,
        alias: user.alias,
        isApproved: user.isApproved,
        theme: user.theme
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'businessDescription', 'address', 'theme'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

