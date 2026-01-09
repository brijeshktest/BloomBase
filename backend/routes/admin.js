const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Config = require('../models/Config');
const { protect, adminOnly } = require('../middleware/auth');
const crypto = require('crypto');
const { normalizeIndianPhone } = require('../utils/phone');

const router = express.Router();

// Get admin contact information (public endpoint for sellers to contact admin)
// MUST be before /sellers routes to avoid route conflicts
router.get('/contact-info', async (req, res) => {
  try {
    // Get admin phone from environment or find admin user
    let adminPhone = process.env.ADMIN_PHONE;
    
    if (!adminPhone) {
      // Fallback: get from admin user
      const admin = await User.findOne({ role: 'admin' }).select('phone');
      adminPhone = admin?.phone || null;
    }
    
    res.json({
      whatsapp: adminPhone,
      email: process.env.ADMIN_EMAIL || 'admin@selllocalonline.com'
    });
  } catch (error) {
    console.error('Error getting admin contact info:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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
    const message = encodeURIComponent(`🎉 Congratulations ${seller.name}!\n\nYour SellLocal Online seller account for "${seller.businessName}" has been approved!\n\nYou can now login and start adding products.\n\nYour store URL: ${seller.alias}\n\nHappy selling! 🚀`);
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
      `🔒 SellLocal Online WhatsApp Number Verification\n\nHi ${seller.name},\n\nPlease verify your WhatsApp number to proceed with approval of your seller account.\n\n✅ Tap this link to verify:\n${verifyUrl}\n\nIf you did not request this, you can ignore this message.`
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
    
    // When reactivating, also clear suspension status
    if (seller.isActive) {
      seller.isSuspended = false;
    }
    
    await seller.save();

    res.json({ 
      message: `Seller ${seller.isActive ? 'activated' : 'deactivated'}`,
      isActive: seller.isActive,
      isSuspended: seller.isSuspended
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
      `✅ Account Extended!\n\nHi ${seller.name},\n\nYour SellLocal Online seller account has been extended by ${months} month${months > 1 ? 's' : ''}.\n\nYour account is now active until ${newEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.\n\nYou can now login and continue selling! 🚀`
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

// ============================================
// Global Configuration Routes (MUST be before /sellers/:id to avoid route conflicts)
// ============================================

// Get global broadcast setting
router.get('/config/broadcasts-enabled', protect, adminOnly, async (req, res) => {
  try {
    const enabled = await Config.getValue('broadcastsEnabled', true);
    res.json({ enabled });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update global broadcast setting
router.put('/config/broadcasts-enabled', protect, adminOnly, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    console.log('[Admin] Update broadcast setting request:', { 
      enabled, 
      type: typeof enabled, 
      body: req.body,
      userId: req.user._id 
    });
    
    // Validate input
    if (enabled === undefined || enabled === null) {
      return res.status(400).json({ message: 'enabled field is required' });
    }
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ 
        message: 'enabled must be a boolean',
        received: typeof enabled,
        value: enabled
      });
    }
    
    // Update config - try static method first, fallback to direct update
    try {
      let result;
      
      // Try using the static method
      if (typeof Config.setValue === 'function') {
        result = await Config.setValue(
          'broadcastsEnabled', 
          enabled, 
          'Global setting to enable/disable WhatsApp broadcasts feature', 
          req.user._id
        );
      } else {
        // Fallback: direct findOneAndUpdate
        result = await Config.findOneAndUpdate(
          { key: 'broadcastsEnabled' },
          { 
            key: 'broadcastsEnabled',
            value: enabled,
            description: 'Global setting to enable/disable WhatsApp broadcasts feature',
            updatedBy: req.user._id,
            updatedAt: new Date()
          },
          { upsert: true, new: true, runValidators: true }
        );
      }
      
      console.log('[Admin] Config updated successfully:', {
        key: result?.key,
        value: result?.value,
        id: result?._id
      });
      
      res.json({ 
        message: `Broadcasts ${enabled ? 'enabled' : 'disabled'} globally`,
        enabled: result?.value ?? enabled
      });
    } catch (dbError) {
      console.error('[Admin] Database error updating config:', dbError);
      console.error('[Admin] Error name:', dbError.name);
      console.error('[Admin] Error code:', dbError.code);
      throw dbError;
    }
  } catch (error) {
    console.error('[Admin] Error updating broadcast setting:', error);
    console.error('[Admin] Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to update broadcast setting', 
      error: error.message || error.toString()
    });
  }
});

// Toggle seller's broadcast feature
router.put('/sellers/:id/broadcasts-enabled', protect, adminOnly, async (req, res) => {
  try {
    const { enabled } = req.body;
    const seller = await User.findById(req.params.id);
    
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled must be a boolean' });
    }
    
    seller.broadcastsEnabled = enabled;
    await seller.save();
    
    res.json({ 
      message: `Broadcasts ${enabled ? 'enabled' : 'disabled'} for seller`,
      seller: {
        _id: seller._id,
        name: seller.name,
        businessName: seller.businessName,
        broadcastsEnabled: seller.broadcastsEnabled
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

