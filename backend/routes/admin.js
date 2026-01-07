const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const crypto = require('crypto');
const { normalizeIndianPhone } = require('../utils/phone');

const router = express.Router();

// Get all sellers
router.get('/sellers', protect, adminOnly, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let query = { role: 'seller' };

    if (status === 'pending') query.isApproved = false;
    if (status === 'approved') query.isApproved = true;
    if (status === 'active') {
      query.isApproved = true;
      query.isActive = true;
      query.isSuspended = false;
    }
    if (status === 'inactive') query.isActive = false;
    if (status === 'suspended') query.isSuspended = true;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sellers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get product counts for each seller
    const sellersWithStats = await Promise.all(sellers.map(async (seller) => {
      const productCount = await Product.countDocuments({ seller: seller._id });
      const activeProductCount = await Product.countDocuments({ seller: seller._id, isActive: true });
      
      return {
        ...seller.toObject(),
        productCount,
        activeProductCount
      };
    }));

    res.json({
      sellers: sellersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    // Auto-suspend expired sellers first
    await User.autoSuspendExpiredSellers();

    const totalSellers = await User.countDocuments({ role: 'seller' });
    const pendingSellers = await User.countDocuments({ role: 'seller', isApproved: false });
    const activeSellers = await User.countDocuments({ role: 'seller', isApproved: true, isActive: true, isSuspended: false });
    const suspendedSellers = await User.countDocuments({ role: 'seller', isSuspended: true });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalProducts = await Product.countDocuments();

    // Trial expiring soon (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const trialExpiringSoon = await User.countDocuments({
      role: 'seller',
      trialEndsAt: { $lte: sevenDaysFromNow, $gte: new Date() },
      isSuspended: false
    });

    res.json({
      totalSellers,
      pendingSellers,
      activeSellers,
      suspendedSellers,
      totalBuyers,
      totalProducts,
      trialExpiringSoon
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve seller
router.patch('/sellers/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const seller = await User.findOne({ _id: req.params.id, role: 'seller' });
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (!seller.phoneVerified) {
      return res.status(400).json({ message: 'Seller WhatsApp number is not verified yet. Send verification link first.' });
    }

    seller.isApproved = true;
    await seller.save();

    // Generate WhatsApp notification URL for the seller
    const sellerPhone = seller.phone.replace(/\+/g, '').replace(/\s/g, '');
    const message = encodeURIComponent(`🎉 Congratulations ${seller.name}!\n\nYour BloomBase seller account for "${seller.businessName}" has been approved!\n\nYou can now login and start adding products.\n\nYour store URL: ${seller.alias}\n\nHappy selling! 🚀`);
    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${message}`;

    res.json({ 
      message: 'Seller approved successfully',
      seller: {
        id: seller._id,
        name: seller.name,
        businessName: seller.businessName,
        email: seller.email
      },
      notificationUrl: whatsappUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send WhatsApp phone verification link to seller
router.post('/sellers/:id/send-phone-verification', protect, adminOnly, async (req, res) => {
  try {
    const seller = await User.findOne({ _id: req.params.id, role: 'seller' });

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (!seller.phone) {
      return res.status(400).json({ message: 'Seller phone number is missing' });
    }

    // Generate one-time token valid for 7 days
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    seller.phoneVerified = false;
    seller.phoneVerificationToken = token;
    seller.phoneVerificationExpiresAt = expiresAt;
    await seller.save();

    // Ensure stored phone is normalized
    try {
      seller.phone = normalizeIndianPhone(seller.phone);
      await seller.save();
    } catch (err) {
      return res.status(400).json({ message: err.message || 'Invalid seller phone number' });
    }

    const sellerPhone = seller.phone.replace(/\+/g, '').replace(/\s/g, '');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify-phone?token=${token}`;

    const message = encodeURIComponent(
      `🔒 BloomBase WhatsApp Number Verification\n\nHi ${seller.name},\n\nPlease verify your WhatsApp number to proceed with approval of your seller account.\n\n✅ Tap this link to verify:\n${verifyUrl}\n\nIf you did not request this, you can ignore this message.`
    );

    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${message}`;

    res.json({
      message: 'Verification link generated',
      expiresAt,
      verifyUrl,
      whatsappUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle seller active status
router.patch('/sellers/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const seller = await User.findOne({ _id: req.params.id, role: 'seller' });
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.isActive = !seller.isActive;
    await seller.save();

    res.json({ 
      message: `Seller ${seller.isActive ? 'activated' : 'deactivated'}`,
      isActive: seller.isActive
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Extend seller validity by months
router.patch('/sellers/:id/extend-validity', protect, adminOnly, async (req, res) => {
  try {
    const { months } = req.body;
    
    if (!months || months < 1) {
      return res.status(400).json({ message: 'Please provide valid number of months (minimum 1)' });
    }
    
    const seller = await User.findOne({ _id: req.params.id, role: 'seller' });
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // If suspended, extend from now, otherwise extend from current end date
    const baseDate = seller.isSuspended ? new Date() : (seller.trialEndsAt || new Date());
    const newEndDate = new Date(baseDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);
    
    seller.trialEndsAt = newEndDate;
    seller.isSuspended = false; // Unsuspend
    seller.isActive = true; // Reactivate
    
    await seller.save();

    // Send WhatsApp notification
    const sellerPhone = seller.phone.replace(/\+/g, '').replace(/\s/g, '');
    const message = encodeURIComponent(
      `✅ Account Extended!\n\nHi ${seller.name},\n\nYour BloomBase seller account has been extended by ${months} month${months > 1 ? 's' : ''}.\n\nYour account is now active until ${newEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.\n\nYou can now login and continue selling! 🚀`
    );
    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${message}`;

    res.json({ 
      message: `Account extended by ${months} month${months > 1 ? 's' : ''}`,
      trialEndsAt: seller.trialEndsAt,
      notificationUrl: whatsappUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get seller details
router.get('/sellers/:id', protect, adminOnly, async (req, res) => {
  try {
    const seller = await User.findOne({ _id: req.params.id, role: 'seller' }).select('-password');
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const products = await Product.find({ seller: seller._id }).select('name basePrice isActive createdAt');
    const buyerCount = await User.countDocuments({ registeredOnSeller: seller._id });

    res.json({
      seller,
      products,
      buyerCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

