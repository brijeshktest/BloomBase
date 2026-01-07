const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: ['page_view', 'product_view', 'add_to_cart', 'remove_from_cart', 'checkout_initiated', 'checkout_completed', 'visitor_registration'],
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  page: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  visitorName: {
    type: String,
    trim: true
  },
  visitorPhone: {
    type: String,
    trim: true
  },
  userAgent: String,
  ipAddress: String,
  referrer: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
analyticsSchema.index({ seller: 1, timestamp: -1 });
analyticsSchema.index({ seller: 1, eventType: 1, timestamp: -1 });
analyticsSchema.index({ seller: 1, product: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1, timestamp: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
