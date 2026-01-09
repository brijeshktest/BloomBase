const mongoose = require('mongoose');

const broadcastSubscriptionSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Can be a registered buyer or a visitor (phone number)
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For visitors who haven't registered
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    trim: true
  },
  // Subscription status
  isSubscribed: {
    type: Boolean,
    default: true,
    index: true
  },
  // When they subscribed
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  // When they unsubscribed (if applicable)
  unsubscribedAt: {
    type: Date
  },
  // Subscription source
  source: {
    type: String,
    enum: ['manual', 'checkout', 'registration', 'product_page', 'admin'],
    default: 'manual'
  },
  // Opt-in token for verification
  optInToken: {
    type: String,
    unique: true,
    sparse: true
  },
  // Opt-out token
  optOutToken: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one subscription per seller-phone combination
broadcastSubscriptionSchema.index({ seller: 1, phone: 1 }, { unique: true });
broadcastSubscriptionSchema.index({ seller: 1, isSubscribed: 1 });
broadcastSubscriptionSchema.index({ phone: 1, isSubscribed: 1 });

module.exports = mongoose.model('BroadcastSubscription', broadcastSubscriptionSchema);
