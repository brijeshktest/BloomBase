const mongoose = require('mongoose');

const priceTierSchema = new mongoose.Schema({
  minQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  maxQuantity: {
    type: Number
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
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
  slug: {
    type: String,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  priceTiers: [priceTierSchema],
  minimumOrderQuantity: {
    type: Number,
    default: 1,
    min: 1
  },
  images: [{
    type: String
  }],
  video: {
    type: {
      type: String,
      enum: ['file', 'link']
    },
    url: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: 'piece',
    enum: ['piece', 'kg', 'gram', 'liter', 'ml', 'dozen', 'pack']
  },
  tags: [String],
  metaTitle: String,
  metaDescription: String
}, {
  timestamps: true
});

// Create compound index for seller + slug uniqueness
productSchema.index({ seller: 1, slug: 1 }, { unique: true });

// Text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });

// Calculate price based on quantity
productSchema.methods.getPriceForQuantity = function(quantity) {
  if (!this.priceTiers || this.priceTiers.length === 0) {
    return this.basePrice;
  }
  
  const sortedTiers = [...this.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
  
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      if (!tier.maxQuantity || quantity <= tier.maxQuantity) {
        return tier.price;
      }
    }
  }
  
  return this.basePrice;
};

module.exports = mongoose.model('Product', productSchema);

