const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

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
    }
    if (status === 'inactive') query.isActive = false;

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
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const pendingSellers = await User.countDocuments({ role: 'seller', isApproved: false });
    const activeSellers = await User.countDocuments({ role: 'seller', isApproved: true, isActive: true });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalProducts = await Product.countDocuments();

    // Trial expiring soon (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const trialExpiringSoon = await User.countDocuments({
      role: 'seller',
      trialEndsAt: { $lte: sevenDaysFromNow, $gte: new Date() }
    });

    res.json({
      totalSellers,
      pendingSellers,
      activeSellers,
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

// Extend seller trial
router.patch('/sellers/:id/extend-trial', protect, adminOnly, async (req, res) => {
  try {
    const { days } = req.body;
    
    const seller = await User.findOne({ _id: req.params.id, role: 'seller' });
    
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const currentEndDate = seller.trialEndsAt || new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + (days || 30));
    
    seller.trialEndsAt = newEndDate;
    await seller.save();

    res.json({ 
      message: `Trial extended by ${days || 30} days`,
      trialEndsAt: seller.trialEndsAt
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

