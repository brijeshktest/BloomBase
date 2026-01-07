const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get cart for a specific seller's store
router.get('/:sellerAlias', protect, async (req, res) => {
  try {
    const seller = await User.findOne({ alias: req.params.sellerAlias, role: 'seller' });
    if (!seller) {
      return res.status(404).json({ message: 'Store not found' });
    }

    let cart = await Cart.findOne({ buyer: req.user._id, seller: seller._id })
      .populate('items.product');

    if (!cart) {
      cart = { items: [], total: 0 };
    } else {
      // Filter out inactive products
      cart.items = cart.items.filter(item => item.product && item.product.isActive);
      
      // Apply promotions
      const now = new Date();
      const promotions = await Promotion.find({
        seller: seller._id,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      });

      let total = 0;
      const itemsWithPricing = cart.items.map(item => {
        const product = item.product;
        let price = product.getPriceForQuantity(item.quantity);
        
        // Check for promotions
        for (const promo of promotions) {
          if (promo.applyToAll || promo.products.some(p => p.toString() === product._id.toString())) {
            price = promo.applyDiscount(price);
            break;
          }
        }
        
        total += price * item.quantity;
        
        return {
          product: product.toObject(),
          quantity: item.quantity,
          unitPrice: price,
          lineTotal: price * item.quantity
        };
      });

      cart = {
        items: itemsWithPricing,
        total
      };
    }

    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to cart
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, quantity, sellerAlias } = req.body;

    const seller = await User.findOne({ alias: sellerAlias, role: 'seller', isActive: true });
    if (!seller) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const product = await Product.findOne({ _id: productId, seller: seller._id, isActive: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (quantity < product.minimumOrderQuantity) {
      return res.status(400).json({ 
        message: `Minimum order quantity is ${product.minimumOrderQuantity}` 
      });
    }

    let cart = await Cart.findOne({ buyer: req.user._id, seller: seller._id });

    if (!cart) {
      cart = new Cart({
        buyer: req.user._id,
        seller: seller._id,
        items: []
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    const price = product.getPriceForQuantity(quantity);

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = quantity;
      cart.items[existingItemIndex].priceAtAdd = price;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        priceAtAdd: price
      });
    }

    await cart.save();
    await cart.populate('items.product');

    res.json({ message: 'Cart updated', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update cart item quantity
router.put('/update', protect, async (req, res) => {
  try {
    const { productId, quantity, sellerAlias } = req.body;

    const seller = await User.findOne({ alias: sellerAlias, role: 'seller' });
    if (!seller) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const cart = await Cart.findOne({ buyer: req.user._id, seller: seller._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (quantity < product.minimumOrderQuantity) {
      return res.status(400).json({ 
        message: `Minimum order quantity is ${product.minimumOrderQuantity}` 
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].priceAtAdd = product.getPriceForQuantity(quantity);

    await cart.save();
    await cart.populate('items.product');

    res.json({ message: 'Cart updated', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from cart
router.delete('/remove/:sellerAlias/:productId', protect, async (req, res) => {
  try {
    const { sellerAlias, productId } = req.params;

    const seller = await User.findOne({ alias: sellerAlias, role: 'seller' });
    if (!seller) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const cart = await Cart.findOne({ buyer: req.user._id, seller: seller._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Checkout - Generate WhatsApp message
router.post('/checkout/:sellerAlias', protect, async (req, res) => {
  try {
    const seller = await User.findOne({ alias: req.params.sellerAlias, role: 'seller' });
    if (!seller) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const cart = await Cart.findOne({ buyer: req.user._id, seller: seller._id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Build order message
    let message = `🛒 *New Order from ${req.user.name}*\n\n`;
    message += `📧 Email: ${req.user.email}\n`;
    if (req.user.phone) message += `📱 Phone: ${req.user.phone}\n`;
    message += `\n*Order Details:*\n`;
    message += `${'─'.repeat(30)}\n`;

    let total = 0;
    for (const item of cart.items) {
      if (item.product && item.product.isActive) {
        const price = item.product.getPriceForQuantity(item.quantity);
        const lineTotal = price * item.quantity;
        total += lineTotal;
        message += `\n📦 *${item.product.name}*\n`;
        message += `   Qty: ${item.quantity} × ₹${price.toFixed(2)} = ₹${lineTotal.toFixed(2)}\n`;
      }
    }

    message += `\n${'─'.repeat(30)}\n`;
    message += `*Total: ₹${total.toFixed(2)}*\n\n`;
    message += `_Sent via ${seller.businessName}_`;

    // Create WhatsApp URL
    const sellerPhone = seller.phone.replace(/\+/g, '').replace(/\s/g, '');
    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(message)}`;

    // Clear the cart after checkout
    await Cart.findByIdAndDelete(cart._id);

    res.json({
      whatsappUrl,
      message: 'Redirecting to WhatsApp...',
      orderSummary: {
        items: cart.items.length,
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

