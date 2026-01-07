const express = require('express');
const { body, validationResult } = require('express-validator');
const Promotion = require('../models/Promotion');
const Product = require('../models/Product');
const { protect, sellerOnly, checkTrial } = require('../middleware/auth');

const router = express.Router();

// Get all promotions for seller
router.get('/', protect, sellerOnly, async (req, res) => {
  try {
    const { status } = req.query;
    let query = { seller: req.user._id };

    const now = new Date();
    if (status === 'active') {
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (status === 'upcoming') {
      query.startDate = { $gt: now };
    } else if (status === 'expired') {
      query.endDate = { $lt: now };
    }

    const promotions = await Promotion.find(query)
      .populate('products', 'name slug basePrice')
      .sort({ createdAt: -1 });

    res.json(promotions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create promotion
router.post('/', protect, sellerOnly, checkTrial, [
  body('name').trim().notEmpty(),
  body('discountType').isIn(['percentage', 'absolute']),
  body('discountValue').isFloat({ min: 0 }),
  body('startDate').isISO8601(),
  body('endDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, discountType, discountValue, applyToAll, products, startDate, endDate, code } = req.body;

    // Validate discount value for percentage
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    // Validate products belong to seller
    if (products && products.length > 0) {
      const validProducts = await Product.countDocuments({
        _id: { $in: products },
        seller: req.user._id
      });

      if (validProducts !== products.length) {
        return res.status(400).json({ message: 'Some products are invalid' });
      }
    }

    const promotion = await Promotion.create({
      seller: req.user._id,
      name,
      description,
      discountType,
      discountValue,
      applyToAll: applyToAll || false,
      products: applyToAll ? [] : products,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      code
    });

    res.status(201).json(promotion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update promotion
router.put('/:id', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const promotion = await Promotion.findOne({ _id: req.params.id, seller: req.user._id });
    
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    const updates = { ...req.body };

    // Validate discount value for percentage
    if (updates.discountType === 'percentage' && updates.discountValue > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    // Validate products if provided
    if (updates.products && updates.products.length > 0) {
      const validProducts = await Product.countDocuments({
        _id: { $in: updates.products },
        seller: req.user._id
      });

      if (validProducts !== updates.products.length) {
        return res.status(400).json({ message: 'Some products are invalid' });
      }
    }

    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const updatedPromotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('products', 'name slug basePrice');

    res.json(updatedPromotion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle promotion active status
router.patch('/:id/toggle', protect, sellerOnly, async (req, res) => {
  try {
    const promotion = await Promotion.findOne({ _id: req.params.id, seller: req.user._id });
    
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    promotion.isActive = !promotion.isActive;
    await promotion.save();

    res.json({ message: `Promotion ${promotion.isActive ? 'activated' : 'deactivated'}`, isActive: promotion.isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete promotion
router.delete('/:id', protect, sellerOnly, async (req, res) => {
  try {
    const promotion = await Promotion.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    
    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

