const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['new_arrival', 'promotion', 'announcement', 'custom'],
    default: 'new_arrival'
  },
  // Optional: Link to specific product
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  // Optional: Link to promotion
  promotion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion'
  },
  // Store link to include in message
  storeLink: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
    default: 'draft',
    index: true
  },
  scheduledAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  // Statistics
  totalRecipients: {
    type: Number,
    default: 0
  },
  sentCount: {
    type: Number,
    default: 0
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  // Error tracking (using broadcastErrors to avoid reserved keyword conflict)
  broadcastErrors: [{
    phone: String,
    error: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
broadcastSchema.index({ seller: 1, createdAt: -1 });
broadcastSchema.index({ seller: 1, status: 1 });
broadcastSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model('Broadcast', broadcastSchema);
