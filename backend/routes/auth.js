const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { createSlug } = require('../utils/slugify');
const { protect } = require('../middleware/auth');
const { normalizeIndianPhone } = require('../utils/phone');

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
    let normalizedPhone;
    try {
      normalizedPhone = normalizeIndianPhone(phone);
    } catch (err) {
      return res.status(400).json({ message: err.message || 'Invalid phone number' });
    }

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
      phone: normalizedPhone,
      role: 'seller',
      businessName,
      alias,
      theme: theme || 'minimal',
      businessDescription,
      address,
      isApproved: false,
      phoneVerified: false
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

// Verify Seller Phone (token link)
// This is intended to be opened from WhatsApp; it does not require login.
router.get('/verify-phone', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Missing verification token' });
    }

    const seller = await User.findOne({
      role: 'seller',
      phoneVerificationToken: token,
      phoneVerificationExpiresAt: { $gt: new Date() }
    });

    if (!seller) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    seller.phoneVerified = true;
    seller.phoneVerificationToken = undefined;
    seller.phoneVerificationExpiresAt = undefined;
    await seller.save();

    return res.json({ message: 'WhatsApp number verified successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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

    const buyerData = {
      email,
      password,
      name,
      phone,
      role: 'buyer',
      registeredOnSeller: seller._id,
      isApproved: true,
      isActive: true
    };

    // Normalize phone if provided
    if (phone) {
      try {
        buyerData.phone = normalizeIndianPhone(phone);
      } catch (err) {
        return res.status(400).json({ message: err.message || 'Invalid phone number' });
      }
    }

    const buyer = await User.create(buyerData);

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
    const allowedUpdates = ['name', 'phone', 'businessDescription', 'address', 'theme', 
                           'seoMetaTitle', 'seoMetaDescription', 'seoKeywords', 'seoLocalArea'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle SEO keywords - convert string to array if needed
    if (updates.seoKeywords && typeof updates.seoKeywords === 'string') {
      updates.seoKeywords = updates.seoKeywords.split(',').map(k => k.trim()).filter(k => k);
    }

    // If seller changes phone, require re-verification
    if (req.user.role === 'seller' && updates.phone && updates.phone !== req.user.phone) {
      try {
        updates.phone = normalizeIndianPhone(updates.phone);
      } catch (err) {
        return res.status(400).json({ message: err.message || 'Invalid phone number' });
      }
      updates.phoneVerified = false;
      updates.phoneVerificationToken = undefined;
      updates.phoneVerificationExpiresAt = undefined;
    } else if (updates.phone) {
      // For non-sellers / buyer phone updates, still normalize
      try {
        updates.phone = normalizeIndianPhone(updates.phone);
      } catch (err) {
        return res.status(400).json({ message: err.message || 'Invalid phone number' });
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

