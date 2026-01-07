const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtAdd: {
    type: Number,
    required: true
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  sessionId: String
}, {
  timestamps: true
});

// Calculate cart total
cartSchema.methods.getTotal = async function() {
  await this.populate('items.product');
  let total = 0;
  
  for (const item of this.items) {
    if (item.product && item.product.isActive) {
      const price = item.product.getPriceForQuantity(item.quantity);
      total += price * item.quantity;
    }
  }
  
  return total;
};

module.exports = mongoose.model('Cart', cartSchema);

