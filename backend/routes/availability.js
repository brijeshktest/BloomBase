const express = require('express');
const AvailabilityRequest = require('../models/AvailabilityRequest');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Request product availability (buyer)
router.post('/request', protect, async (req, res) => {
  try {
    const { productId, sellerAlias } = req.body;

    if (!productId || !sellerAlias) {
      return res.status(400).json({ message: 'Product ID and seller alias are required' });
    }

    const seller = await User.findOne({ alias: sellerAlias, role: 'seller' });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const product = await Product.findOne({ _id: productId, seller: seller._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already requested recently (within last 24 hours)
    const recentRequest = await AvailabilityRequest.findOne({
      product: product._id,
      buyer: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentRequest) {
      return res.status(400).json({ message: 'You have already requested this product recently' });
    }

    const request = new AvailabilityRequest({
      product: product._id,
      seller: seller._id,
      buyer: req.user._id,
      buyerName: req.user.name,
      buyerPhone: req.user.phone || 'Not provided',
      productName: product.name
    });

    await request.save();

    // Notify seller via WhatsApp
    const whatsappMessage = `🔔 New Availability Request\n\n` +
      `Product: ${product.name}\n` +
      `Buyer: ${req.user.name}\n` +
      `Phone: ${req.user.phone || 'Not provided'}\n` +
      `\nPlease update stock if available.`;

    const whatsappUrl = `https://wa.me/${seller.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Mark as notified
    request.status = 'notified';
    request.notifiedAt = new Date();
    await request.save();

    res.json({ 
      message: 'Availability request sent to seller', 
      request,
      whatsappUrl 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get availability requests for seller
router.get('/seller', protect, async (req, res) => {
  try {
    const requests = await AvailabilityRequest.find({ seller: req.user._id })
      .populate('product', 'name slug images basePrice')
      .populate('buyer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark request as fulfilled
router.patch('/:id/fulfill', protect, async (req, res) => {
  try {
    const request = await AvailabilityRequest.findOne({ 
      _id: req.params.id, 
      seller: req.user._id 
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'fulfilled';
    request.fulfilledAt = new Date();
    await request.save();

    res.json({ message: 'Request marked as fulfilled', request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

