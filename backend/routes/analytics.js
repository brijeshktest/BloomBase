const express = require('express');
const Analytics = require('../models/Analytics');
const Product = require('../models/Product');
const { protect, sellerOnly, checkTrial } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Track analytics event (public endpoint)
router.post('/track', async (req, res) => {
  try {
    const { sellerAlias, eventType, sessionId, buyerId, productId, page, metadata } = req.body;

    if (!sellerAlias || !eventType) {
      return res.status(400).json({ message: 'Seller alias and event type are required' });
    }

    // Get seller by alias
    const seller = await User.findOne({ alias: sellerAlias, role: 'seller', isActive: true, isApproved: true });
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Get IP and user agent
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers['referer'];

    const analyticsData = {
      seller: seller._id,
      eventType,
      sessionId: sessionId || `anon_${Date.now()}_${Math.random()}`,
      buyerId: buyerId || null,
      product: productId || null,
      page: page || null,
      metadata: metadata || {},
      userAgent,
      ipAddress,
      referrer,
      timestamp: new Date()
    };

    await Analytics.create(analyticsData);

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get analytics overview for seller
router.get('/overview', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const sellerId = req.user._id;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Total page views
    const totalPageViews = await Analytics.countDocuments({
      seller: sellerId,
      eventType: 'page_view',
      timestamp: { $gte: startDate }
    });

    // Unique visitors (by session)
    const uniqueVisitors = await Analytics.distinct('sessionId', {
      seller: sellerId,
      eventType: 'page_view',
      timestamp: { $gte: startDate }
    });

    // Product views
    const productViews = await Analytics.countDocuments({
      seller: sellerId,
      eventType: 'product_view',
      timestamp: { $gte: startDate }
    });

    // Add to cart events
    const addToCartEvents = await Analytics.countDocuments({
      seller: sellerId,
      eventType: 'add_to_cart',
      timestamp: { $gte: startDate }
    });

    // Checkout initiated
    const checkoutInitiated = await Analytics.countDocuments({
      seller: sellerId,
      eventType: 'checkout_initiated',
      timestamp: { $gte: startDate }
    });

    // Checkout completed
    const checkoutCompleted = await Analytics.countDocuments({
      seller: sellerId,
      eventType: 'checkout_completed',
      timestamp: { $gte: startDate }
    });

    // Calculate conversion rates
    const cartToCheckoutRate = productViews > 0 ? ((addToCartEvents / productViews) * 100).toFixed(1) : 0;
    const checkoutConversionRate = addToCartEvents > 0 ? ((checkoutInitiated / addToCartEvents) * 100).toFixed(1) : 0;

    // Most viewed products
    const topProducts = await Analytics.aggregate([
      {
        $match: {
          seller: sellerId,
          eventType: 'product_view',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$product',
          views: { $sum: 1 },
          uniqueViews: { $addToSet: '$sessionId' }
        }
      },
      {
        $sort: { views: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          views: 1,
          uniqueViews: { $size: '$uniqueViews' }
        }
      }
    ]);

    // Hourly activity distribution
    const hourlyActivity = await Analytics.aggregate([
      {
        $match: {
          seller: sellerId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Daily activity trend
    const dailyActivity = await Analytics.aggregate([
      {
        $match: {
          seller: sellerId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] }
          },
          productViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'product_view'] }, 1, 0] }
          },
          addToCart: {
            $sum: { $cond: [{ $eq: ['$eventType', 'add_to_cart'] }, 1, 0] }
          },
          checkouts: {
            $sum: { $cond: [{ $eq: ['$eventType', 'checkout_initiated'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Cart abandonment rate
    const cartAbandonmentRate = addToCartEvents > 0 
      ? (((addToCartEvents - checkoutInitiated) / addToCartEvents) * 100).toFixed(1)
      : 0;

    res.json({
      overview: {
        totalPageViews,
        uniqueVisitors: uniqueVisitors.length,
        productViews,
        addToCartEvents,
        checkoutInitiated,
        checkoutCompleted,
        cartToCheckoutRate: parseFloat(cartToCheckoutRate),
        checkoutConversionRate: parseFloat(checkoutConversionRate),
        cartAbandonmentRate: parseFloat(cartAbandonmentRate)
      },
      topProducts,
      hourlyActivity,
      dailyActivity,
      period
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get product-specific analytics
router.get('/products/:productId', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const { productId } = req.params;
    const { period = '7d' } = req.query;
    const sellerId = req.user._id;

    // Verify product belongs to seller
    const product = await Product.findOne({ _id: productId, seller: sellerId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const now = new Date();
    let startDate = new Date();
    startDate.setDate(now.getDate() - parseInt(period.replace('d', '')) || 7);

    const productViews = await Analytics.countDocuments({
      seller: sellerId,
      product: productId,
      eventType: 'product_view',
      timestamp: { $gte: startDate }
    });

    const addToCart = await Analytics.countDocuments({
      seller: sellerId,
      product: productId,
      eventType: 'add_to_cart',
      timestamp: { $gte: startDate }
    });

    const conversionRate = productViews > 0 ? ((addToCart / productViews) * 100).toFixed(2) : 0;

    res.json({
      productViews,
      addToCart,
      conversionRate: parseFloat(conversionRate)
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
