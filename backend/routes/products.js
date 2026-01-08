const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const User = require('../models/User');
const { protect, sellerOnly, checkTrial } = require('../middleware/auth');
const { createUniqueSlug } = require('../utils/slugify');
const upload = require('../utils/upload');
const { validateImage } = require('../utils/imageValidator');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Get products for a seller (public - for microsite)
router.get('/store/:alias', async (req, res) => {
  try {
    const { alias } = req.params;
    const { search, sort, category, page = 1, limit = 20, onSale } = req.query;

    const seller = await User.findOne({ alias, role: 'seller', isActive: true, isApproved: true });
    if (!seller) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Get active promotions first (used for sale banner + optional filtering)
    const now = new Date();
    const promotions = await Promotion.find({
      seller: seller._id,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    let query = { seller: seller._id, isActive: true };

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Filter only products on sale (have an active promotion)
    const onSaleEnabled = onSale === '1' || onSale === 'true';
    if (onSaleEnabled) {
      if (!promotions || promotions.length === 0) {
        // No active promotions => no sale items
        return res.json({
          products: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          },
          categories: [],
          store: {
            businessName: seller.businessName,
            businessDescription: seller.businessDescription,
            theme: seller.theme,
            logo: seller.businessLogo,
            banner: seller.businessBanner,
            instagramHandle: seller.instagramHandle,
            facebookHandle: seller.facebookHandle
          },
          activePromotions: []
        });
      }

      const appliesToAll = promotions.some((p) => p.applyToAll);
      if (!appliesToAll) {
        const promotedIds = [
          ...new Set(
            promotions
              .flatMap((p) => (p.products || []).map((id) => id.toString()))
              .filter(Boolean)
          )
        ];

        if (promotedIds.length === 0) {
          return res.json({
            products: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            },
            categories: [],
            store: {
              businessName: seller.businessName,
              businessDescription: seller.businessDescription,
              theme: seller.theme,
              logo: seller.businessLogo,
              banner: seller.businessBanner
            },
            activePromotions: promotions.map((p) => ({
              _id: p._id,
              name: p.name,
              discountType: p.discountType,
              discountValue: p.discountValue,
              applyToAll: p.applyToAll
            }))
          });
        }

        query._id = { $in: promotedIds };
      }
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
        banner: seller.businessBanner,
        seoMetaTitle: seller.seoMetaTitle,
        seoMetaDescription: seller.seoMetaDescription,
        seoKeywords: seller.seoKeywords,
        seoLocalArea: seller.seoLocalArea,
        address: seller.address,
        instagramHandle: seller.instagramHandle,
        facebookHandle: seller.facebookHandle
      },
      activePromotions: promotions.map((p) => ({
        _id: p._id,
        name: p.name,
        discountType: p.discountType,
        discountValue: p.discountValue,
        applyToAll: p.applyToAll
      }))
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

    // Handle images with validation
    if (req.files && req.files.images) {
      const validImages = [];
      const errors = [];
      
      for (const file of req.files.images) {
        const filePath = path.join(__dirname, '..', file.path);
        const validation = await validateImage(filePath, 'product');
        
        if (validation.valid) {
          validImages.push(`/uploads/products/images/${file.filename}`);
        } else {
          // Delete invalid file
          fs.unlinkSync(filePath);
          errors.push(`Image ${file.originalname}: ${validation.error}`);
        }
      }
      
      if (errors.length > 0) {
        // Delete any valid files that were uploaded alongside invalid ones
        validImages.forEach(img => {
          const imgPath = path.join(__dirname, '..', img);
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        });
        return res.status(400).json({
          message: 'Product image validation failed',
          errors: errors,
          requirements: 'Product images must be square (400x400 to 2400x2400 pixels, max 5MB per image). Recommended: 1200x1200px'
        });
      }
      
      productData.images = validImages;
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

    // Handle new images with validation
    if (req.files && req.files.images) {
      const validImages = [];
      const errors = [];
      
      for (const file of req.files.images) {
        const filePath = path.join(__dirname, '..', file.path);
        const validation = await validateImage(filePath, 'product');
        
        if (validation.valid) {
          validImages.push(`/uploads/products/images/${file.filename}`);
        } else {
          // Delete invalid file
          fs.unlinkSync(filePath);
          errors.push(`Image ${file.originalname}: ${validation.error}`);
        }
      }
      
      if (errors.length > 0) {
        // Delete any valid files that were uploaded alongside invalid ones
        validImages.forEach(img => {
          const imgPath = path.join(__dirname, '..', img);
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        });
        return res.status(400).json({
          message: 'Product image validation failed',
          errors: errors,
          requirements: 'Product images must be square (400x400 to 2400x2400 pixels, max 5MB per image). Recommended: 1200x1200px'
        });
      }
      
      updates.images = [...(product.images || []), ...validImages];
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

// Increase product stock
router.patch('/:id/increase-stock', protect, sellerOnly, checkTrial, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0 || !Number.isInteger(Number(quantity))) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.stock = (product.stock || 0) + parseInt(quantity);
    await product.save();

    res.json({ message: 'Stock increased successfully', product });
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

