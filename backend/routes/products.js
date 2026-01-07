const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const User = require('../models/User');
const { protect, sellerOnly, checkTrial } = require('../middleware/auth');
const { createUniqueSlug } = require('../utils/slugify');
const upload = require('../utils/upload');

const router = express.Router();

// Get products for a seller (public - for microsite)
router.get('/store/:alias', async (req, res) => {
  try {
    const { alias } = req.params;
    const { search, sort, category, page = 1, limit = 20 } = req.query;

    const seller = await User.findOne({ alias, role: 'seller', isActive: true, isApproved: true });
    if (!seller) {
      return res.status(404).json({ message: 'Store not found' });
    }

    let query = { seller: seller._id, isActive: true };

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { basePrice: 1 };
    if (sort === 'price_desc') sortOption = { basePrice: -1 };
    if (sort === 'name_asc') sortOption = { name: 1 };
    if (sort === 'name_desc') sortOption = { name: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    // Get active promotions
    const now = new Date();
    const promotions = await Promotion.find({
      seller: seller._id,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    // Apply promotions to products
    const productsWithDiscounts = products.map(product => {
      const productObj = product.toObject();
      
      for (const promo of promotions) {
        if (promo.applyToAll || promo.products.some(p => p.toString() === product._id.toString())) {
          productObj.hasPromotion = true;
          productObj.promotion = {
            name: promo.name,
            discountType: promo.discountType,
            discountValue: promo.discountValue
          };
          productObj.discountedPrice = promo.applyDiscount(product.basePrice);
          break;
        }
      }
      
      return productObj;
    });

    // Get categories for filter
    const categories = await Product.distinct('category', { seller: seller._id, isActive: true });

    res.json({
      products: productsWithDiscounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      categories,
      store: {
        businessName: seller.businessName,
        businessDescription: seller.businessDescription,
        theme: seller.theme,
        logo: seller.businessLogo,
        banner: seller.businessBanner
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product (public)
router.get('/store/:alias/:slug', async (req, res) => {
  try {
    const { alias, slug } = req.params;

    const seller = await User.findOne({ alias, role: 'seller', isActive: true, isApproved: true });
    if (!seller) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const product = await Product.findOne({ seller: seller._id, slug, isActive: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check for active promotions
    const now = new Date();
    const promotion = await Promotion.findOne({
      seller: seller._id,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { applyToAll: true },
        { products: product._id }
      ]
    });

    const productObj = product.toObject();
    if (promotion) {
      productObj.hasPromotion = true;
      productObj.promotion = {
        name: promotion.name,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue
      };
      productObj.discountedPrice = promotion.applyDiscount(product.basePrice);
    }

    res.json({
      product: productObj,
      store: {
        businessName: seller.businessName,
        phone: seller.phone,
        theme: seller.theme
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Seller routes - protected
// Get all seller's products
router.get('/my-products', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const { search, sort, category, status, page = 1, limit = 20 } = req.query;

    let query = { seller: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { basePrice: 1 };
    if (sort === 'price_desc') sortOption = { basePrice: -1 };
    if (sort === 'name_asc') sortOption = { name: 1 };
    if (sort === 'name_desc') sortOption = { name: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);
    const categories = await Product.distinct('category', { seller: req.user._id });

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create product
router.post('/', protect, sellerOnly, checkTrial, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      priceTiers,
      minimumOrderQuantity,
      stock,
      unit,
      tags,
      videoLink,
      metaTitle,
      metaDescription
    } = req.body;

    const slug = await createUniqueSlug(Product, name, req.user._id);

    const productData = {
      seller: req.user._id,
      name,
      slug,
      description,
      category,
      basePrice: parseFloat(basePrice),
      minimumOrderQuantity: parseInt(minimumOrderQuantity) || 1,
      stock: parseInt(stock) || 0,
      unit: unit || 'piece',
      metaTitle: metaTitle || name,
      metaDescription: metaDescription || description?.substring(0, 160)
    };

    // Handle price tiers
    if (priceTiers) {
      productData.priceTiers = typeof priceTiers === 'string' ? JSON.parse(priceTiers) : priceTiers;
    }

    // Handle tags
    if (tags) {
      productData.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }

    // Handle images
    if (req.files && req.files.images) {
      productData.images = req.files.images.map(file => `/uploads/products/images/${file.filename}`);
    }

    // Handle video
    if (req.files && req.files.video) {
      productData.video = {
        type: 'file',
        url: `/uploads/products/videos/${req.files.video[0].filename}`
      };
    } else if (videoLink) {
      productData.video = {
        type: 'link',
        url: videoLink
      };
    }

    const product = await Product.create(productData);

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product
router.put('/:id', protect, sellerOnly, checkTrial, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updates = { ...req.body };

    // Handle name change - update slug
    if (updates.name && updates.name !== product.name) {
      updates.slug = await createUniqueSlug(Product, updates.name, req.user._id, product._id);
    }

    // Parse numeric fields
    if (updates.basePrice) updates.basePrice = parseFloat(updates.basePrice);
    if (updates.minimumOrderQuantity) updates.minimumOrderQuantity = parseInt(updates.minimumOrderQuantity);
    if (updates.stock) updates.stock = parseInt(updates.stock);

    // Handle price tiers
    if (updates.priceTiers) {
      updates.priceTiers = typeof updates.priceTiers === 'string' ? JSON.parse(updates.priceTiers) : updates.priceTiers;
    }

    // Handle tags
    if (updates.tags) {
      updates.tags = typeof updates.tags === 'string' ? updates.tags.split(',').map(t => t.trim()) : updates.tags;
    }

    // Handle new images
    if (req.files && req.files.images) {
      const newImages = req.files.images.map(file => `/uploads/products/images/${file.filename}`);
      updates.images = [...(product.images || []), ...newImages];
    }

    // Handle removing images
    if (updates.removeImages) {
      const toRemove = typeof updates.removeImages === 'string' ? JSON.parse(updates.removeImages) : updates.removeImages;
      updates.images = (updates.images || product.images).filter(img => !toRemove.includes(img));
      delete updates.removeImages;
    }

    // Handle video
    if (req.files && req.files.video) {
      updates.video = {
        type: 'file',
        url: `/uploads/products/videos/${req.files.video[0].filename}`
      };
    } else if (updates.videoLink) {
      updates.video = {
        type: 'link',
        url: updates.videoLink
      };
      delete updates.videoLink;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle product active status
router.patch('/:id/toggle', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({ message: `Product ${product.isActive ? 'enabled' : 'disabled'}`, isActive: product.isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product
router.delete('/:id', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

