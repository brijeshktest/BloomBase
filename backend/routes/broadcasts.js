const express = require('express');
const { body, validationResult } = require('express-validator');
const Broadcast = require('../models/Broadcast');
const BroadcastSubscription = require('../models/BroadcastSubscription');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, sellerOnly, checkTrial } = require('../middleware/auth');
const { sendBroadcast, buildBroadcastMessage, generateToken, formatPhoneForWhatsApp } = require('../utils/whatsappBroadcast');
const { normalizeIndianPhone } = require('../utils/phone');

const router = express.Router();

// Get all subscriptions for a seller (with opt-in status)
router.get('/subscriptions', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const { page = 1, limit = 50, status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { seller: req.user._id };
    
    if (status === 'subscribed') {
      query.isSubscribed = true;
    } else if (status === 'unsubscribed') {
      query.isSubscribed = false;
    }
    
    const subscriptions = await BroadcastSubscription.find(query)
      .populate('buyer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await BroadcastSubscription.countDocuments(query);
    const subscribedCount = await BroadcastSubscription.countDocuments({ 
      seller: req.user._id, 
      isSubscribed: true 
    });
    
    res.json({
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        total,
        subscribed: subscribedCount,
        unsubscribed: total - subscribedCount
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add subscription (opt-in) - can be called by seller or customer
router.post('/subscriptions', async (req, res) => {
  try {
    const { phone, name, sellerId } = req.body;
    
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Normalize phone number
    let normalizedPhone;
    try {
      normalizedPhone = normalizeIndianPhone(phone);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }
    
    // Get seller - either from sellerId or from authenticated user
    let seller;
    if (sellerId) {
      seller = await User.findById(sellerId);
    } else if (req.user && req.user.role === 'seller') {
      seller = req.user;
    } else {
      return res.status(400).json({ message: 'Seller ID is required' });
    }
    
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    // Check if subscription already exists
    let subscription = await BroadcastSubscription.findOne({
      seller: seller._id,
      phone: normalizedPhone
    });
    
    if (subscription) {
      // If unsubscribed, resubscribe them
      if (!subscription.isSubscribed) {
        subscription.isSubscribed = true;
        subscription.subscribedAt = new Date();
        subscription.unsubscribedAt = null;
        subscription.optOutToken = null;
        subscription.optInToken = generateToken();
        await subscription.save();
      }
    } else {
      // Create new subscription
      subscription = await BroadcastSubscription.create({
        seller: seller._id,
        buyer: req.user && req.user.role === 'buyer' ? req.user._id : null,
        phone: normalizedPhone,
        name: name || (req.user ? req.user.name : ''),
        isSubscribed: true,
        source: req.user ? (req.user.role === 'buyer' ? 'registration' : 'manual') : 'manual',
        optInToken: generateToken()
      });
    }
    
    res.json({
      message: 'Successfully subscribed to updates',
      subscription: {
        phone: subscription.phone,
        name: subscription.name,
        isSubscribed: subscription.isSubscribed
      }
    });
  } catch (error) {
    console.error('Error adding subscription:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already subscribed' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Opt-out (unsubscribe) - public endpoint
router.post('/subscriptions/unsubscribe', async (req, res) => {
  try {
    const { phone, sellerId, token } = req.body;
    
    if (!phone && !token) {
      return res.status(400).json({ message: 'Phone number or token is required' });
    }
    
    let query = {};
    
    if (token) {
      query.optOutToken = token;
    } else {
      if (!sellerId) {
        return res.status(400).json({ message: 'Seller ID is required when using phone number' });
      }
      
      let normalizedPhone;
      try {
        normalizedPhone = normalizeIndianPhone(phone);
      } catch (err) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }
      
      query.seller = sellerId;
      query.phone = normalizedPhone;
    }
    
    const subscription = await BroadcastSubscription.findOne(query);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    if (!subscription.isSubscribed) {
      return res.json({ message: 'Already unsubscribed' });
    }
    
    subscription.isSubscribed = false;
    subscription.unsubscribedAt = new Date();
    subscription.optOutToken = generateToken();
    await subscription.save();
    
    res.json({ message: 'Successfully unsubscribed from updates' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get opt-out link for a subscription
router.get('/subscriptions/:id/opt-out-link', protect, sellerOnly, async (req, res) => {
  try {
    const subscription = await BroadcastSubscription.findOne({
      _id: req.params.id,
      seller: req.user._id
    });
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    if (!subscription.optOutToken) {
      subscription.optOutToken = generateToken();
      await subscription.save();
    }
    
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://selllocalonline.com';
    const optOutLink = `${baseUrl}/unsubscribe?token=${subscription.optOutToken}`;
    
    res.json({ optOutLink });
  } catch (error) {
    console.error('Error generating opt-out link:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all broadcasts for a seller
router.get('/', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { seller: req.user._id };
    if (status) {
      query.status = status;
    }
    
    const broadcasts = await Broadcast.find(query)
      .populate('product', 'name slug images')
      .populate('promotion', 'name discountType discountValue')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Broadcast.countDocuments(query);
    
    res.json({
      broadcasts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single broadcast
router.get('/:id', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const broadcast = await Broadcast.findOne({
      _id: req.params.id,
      seller: req.user._id
    })
      .populate('product', 'name slug images')
      .populate('promotion', 'name discountType discountValue');
    
    if (!broadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }
    
    res.json(broadcast);
  } catch (error) {
    console.error('Error fetching broadcast:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create broadcast
router.post('/', protect, sellerOnly, checkTrial, [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
  body('type').optional().isIn(['new_arrival', 'promotion', 'announcement', 'custom'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, message, type = 'new_arrival', productId, promotionId, scheduledAt } = req.body;
    
    // Build store link
    const seller = await User.findById(req.user._id);
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://selllocalonline.com';
    const storeLink = seller.alias ? `${baseUrl}/store/${seller.alias}` : null;
    
    const broadcast = await Broadcast.create({
      seller: req.user._id,
      title,
      message,
      type,
      product: productId || null,
      promotion: promotionId || null,
      storeLink,
      status: scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null
    });
    
    res.status(201).json(broadcast);
  } catch (error) {
    console.error('Error creating broadcast:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update broadcast
router.put('/:id', protect, sellerOnly, checkTrial, [
  body('title').optional().trim().isLength({ max: 100 }),
  body('message').optional().trim().isLength({ max: 1000 }),
  body('type').optional().isIn(['new_arrival', 'promotion', 'announcement', 'custom'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const broadcast = await Broadcast.findOne({
      _id: req.params.id,
      seller: req.user._id
    });
    
    if (!broadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }
    
    // Don't allow editing if already sent
    if (broadcast.status === 'sent' || broadcast.status === 'sending') {
      return res.status(400).json({ message: 'Cannot edit a broadcast that has been sent' });
    }
    
    const { title, message, type, productId, promotionId, scheduledAt } = req.body;
    
    if (title) broadcast.title = title;
    if (message) broadcast.message = message;
    if (type) broadcast.type = type;
    if (productId !== undefined) broadcast.product = productId || null;
    if (promotionId !== undefined) broadcast.promotion = promotionId || null;
    if (scheduledAt !== undefined) {
      broadcast.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      broadcast.status = scheduledAt ? 'scheduled' : 'draft';
    }
    
    await broadcast.save();
    
    res.json(broadcast);
  } catch (error) {
    console.error('Error updating broadcast:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send broadcast
router.post('/:id/send', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const broadcast = await Broadcast.findOne({
      _id: req.params.id,
      seller: req.user._id
    });
    
    if (!broadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }
    
    if (broadcast.status === 'sent' || broadcast.status === 'sending') {
      return res.status(400).json({ message: 'Broadcast has already been sent' });
    }
    
    // Get all subscribed recipients
    const subscriptions = await BroadcastSubscription.find({
      seller: req.user._id,
      isSubscribed: true
    });
    
    if (subscriptions.length === 0) {
      return res.status(400).json({ message: 'No subscribed recipients found' });
    }
    
    // Update broadcast status
    broadcast.status = 'sending';
    broadcast.totalRecipients = subscriptions.length;
    await broadcast.save();
    
    // Build message with opt-out links
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://selllocalonline.com';
    let fullMessage = broadcast.message;
    
    // Add product link if applicable
    if (broadcast.product) {
      const product = await Product.findById(broadcast.product);
      if (product && broadcast.storeLink) {
        fullMessage += `\n\n🛍️ View Product: ${broadcast.storeLink}/product/${product.slug}`;
      }
    }
    
    // Add promotion link if applicable
    if (broadcast.promotion && broadcast.storeLink) {
      fullMessage += `\n\n🎉 Check out our promotion: ${broadcast.storeLink}`;
    }
    
    // Send to each recipient with personalized opt-out link
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };
    
    for (const subscription of subscriptions) {
      // Generate opt-out link for this recipient
      if (!subscription.optOutToken) {
        subscription.optOutToken = generateToken();
        await subscription.save();
      }
      
      const optOutLink = `${baseUrl}/unsubscribe?token=${subscription.optOutToken}`;
      const personalizedMessage = buildBroadcastMessage(fullMessage, broadcast.storeLink, optOutLink);
      
      try {
        const result = await require('../utils/whatsappBroadcast').sendWhatsAppMessage(
          subscription.phone,
          personalizedMessage
        );
        
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            phone: subscription.phone,
            error: result.error
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          phone: subscription.phone,
          error: error.message
        });
      }
      
      // Rate limiting: 200ms delay between messages
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Update broadcast with results
    broadcast.status = 'sent';
    broadcast.sentAt = new Date();
    broadcast.sentCount = results.sent;
    broadcast.failedCount = results.failed;
    broadcast.errors = results.errors;
    await broadcast.save();
    
    res.json({
      message: 'Broadcast sent successfully',
      broadcast,
      results
    });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    
    // Update broadcast status to failed
    try {
      const broadcast = await Broadcast.findById(req.params.id);
      if (broadcast) {
        broadcast.status = 'failed';
        await broadcast.save();
      }
    } catch (updateError) {
      console.error('Error updating broadcast status:', updateError);
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete broadcast
router.delete('/:id', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const broadcast = await Broadcast.findOne({
      _id: req.params.id,
      seller: req.user._id
    });
    
    if (!broadcast) {
      return res.status(404).json({ message: 'Broadcast not found' });
    }
    
    // Don't allow deleting if already sent
    if (broadcast.status === 'sent') {
      return res.status(400).json({ message: 'Cannot delete a broadcast that has been sent' });
    }
    
    await broadcast.deleteOne();
    
    res.json({ message: 'Broadcast deleted successfully' });
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
