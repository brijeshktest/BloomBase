const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'absolute'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  applyToAll: {
    type: Boolean,
    default: false
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  code: {
    type: String,
    uppercase: true,
    trim: true
  }
}, {
  timestamps: true
});

// Check if promotion is currently valid
promotionSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
};

// Calculate discounted price
promotionSchema.methods.applyDiscount = function(originalPrice) {
  if (this.discountType === 'percentage') {
    return originalPrice - (originalPrice * this.discountValue / 100);
  }
  return Math.max(0, originalPrice - this.discountValue);
};

module.exports = mongoose.model('Promotion', promotionSchema);

