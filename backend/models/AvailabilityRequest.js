const mongoose = require('mongoose');

const availabilityRequestSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyerName: {
    type: String,
    required: true
  },
  buyerPhone: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'notified', 'fulfilled'],
    default: 'pending'
  },
  notifiedAt: Date,
  fulfilledAt: Date
}, {
  timestamps: true
});

// Index for seller queries
availabilityRequestSchema.index({ seller: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('AvailabilityRequest', availabilityRequestSchema);

