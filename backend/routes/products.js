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

    // Get seller document (without lean to ensure all fields are accessible)
    const sellerDoc = await User.findOne({ 
      alias, 
      role: 'seller', 
      isActive: true, 
      isApproved: true,
      isSuspended: false 
    }).select('-password'); // Exclude password only
    
    if (!sellerDoc) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    // Convert to plain object to ensure all fields are included
    const seller = sellerDoc.toObject ? sellerDoc.toObject() : { ...sellerDoc };
    
    // Debug: Log seller phone from document
    console.log(`[Store ${alias}] Seller ID:`, seller._id);
    console.log(`[Store ${alias}] Seller phone from DB:`, seller.phone);
    console.log(`[Store ${alias}] Seller phone type:`, typeof seller.phone);
    console.log(`[Store ${alias}] Seller has phone property:`, seller.hasOwnProperty('phone'));
    console.log(`[Store ${alias}] Seller document phone (direct):`, sellerDoc.phone);
    
    // Ensure phone is included even if undefined
    if (!seller.hasOwnProperty('phone')) {
      seller.phone = sellerDoc.phone || null;
      console.log(`[Store ${alias}] Phone was missing, set to:`, seller.phone);
    }

    // Get active promotions first (used for sale banner + optional filtering)
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const promotions = await Promotion.find({
      seller: seller._id,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    // Get upcoming promotions (starting within 7 days)
    const upcomingPromotions = await Promotion.find({
      seller: seller._id,
      isActive: true,
      startDate: { $gt: now, $lte: sevenDaysFromNow },
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
            phone: seller.phone || null, // Explicitly include phone, even if null
            instagramHandle: seller.instagramHandle,
            facebookHandle: seller.facebookHandle,
            sellerVideo: seller.sellerVideo
          },
          activePromotions: [],
          upcomingPromotions: []
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
              banner: seller.businessBanner,
              phone: seller.phone || null // Explicitly include phone, even if null
            },
            activePromotions: promotions.map((p) => ({
              _id: p._id,
              name: p.name,
              discountType: p.discountType,
              discountValue: p.discountValue,
              applyToAll: p.applyToAll
            })),
            upcomingPromotions: upcomingPromotions.map((p) => ({
              _id: p._id,
              name: p.name,
              discountType: p.discountType,
              discountValue: p.discountValue,
              applyToAll: p.applyToAll,
              startDate: p.startDate
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
        phone: seller.phone !== undefined ? seller.phone : null, // Explicitly include phone, even if empty string
        seoMetaTitle: seller.seoMetaTitle,
        seoMetaDescription: seller.seoMetaDescription,
        seoKeywords: seller.seoKeywords,
        seoLocalArea: seller.seoLocalArea,
        address: seller.address,
        instagramHandle: seller.instagramHandle,
        facebookHandle: seller.facebookHandle,
        sellerVideo: seller.sellerVideo
      },
      activePromotions: promotions.map((p) => ({
        _id: p._id,
        name: p.name,
        discountType: p.discountType,
        discountValue: p.discountValue,
        applyToAll: p.applyToAll
      })),
      upcomingPromotions: upcomingPromotions.map((p) => ({
        _id: p._id,
        name: p.name,
        discountType: p.discountType,
        discountValue: p.discountValue,
        applyToAll: p.applyToAll,
        startDate: p.startDate
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

    // Get seller document (without lean to ensure all fields are accessible)
    const sellerDoc = await User.findOne({ 
      alias, 
      role: 'seller', 
      isActive: true, 
      isApproved: true,
      isSuspended: false 
    }).select('-password'); // Exclude password only
    
    if (!sellerDoc) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    // Convert to plain object to ensure all fields are included
    const seller = sellerDoc.toObject ? sellerDoc.toObject() : { ...sellerDoc };
    
    // Ensure phone is included even if undefined
    if (!seller.hasOwnProperty('phone')) {
      seller.phone = sellerDoc.phone || null;
    }
    
    // Debug: Log seller phone for single product route
    console.log(`[Product ${slug} @ ${alias}] Seller phone from DB:`, seller.phone, 'Type:', typeof seller.phone);

    let product = await Product.findOne({ seller: seller._id, slug, isActive: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Auto-fix: Check if product has image URL in video field
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    if (product.video && product.video.url && imageExtensions.test(product.video.url)) {
      console.log(`[AUTO-FIX] Product ${product._id} (public route): Detected image URL in video field: ${product.video.url}`);
      const imageUrl = product.video.url;
      const currentImages = product.images || [];
      const updatedImages = [...currentImages];
      if (!updatedImages.includes(imageUrl)) {
        updatedImages.push(imageUrl);
      }
      
      // Use $set and $unset together to update images and remove video
      const updateResult = await Product.updateOne(
        { _id: product._id },
        { 
          $set: { images: updatedImages },
          $unset: { video: '' }
        }
      );
      
      console.log(`[AUTO-FIX] Product ${product._id}: Update result - modified: ${updateResult.modifiedCount}, matched: ${updateResult.matchedCount}`);
      
      // Refresh product
      product = await Product.findById(product._id);
      
      if (product.video) {
        console.error(`[AUTO-FIX] ERROR: Product ${product._id} still has video field after fix!`);
      } else {
        console.log(`[AUTO-FIX] SUCCESS: Product ${product._id} video field cleared, image moved to images array`);
      }
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
        theme: seller.theme,
        sellerVideo: seller.sellerVideo
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

    // Auto-fix products with image URLs in video field
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    const productsToFix = [];
    
    for (const product of products) {
      if (product.video && product.video.url && imageExtensions.test(product.video.url)) {
        productsToFix.push(product._id);
        console.log(`[AUTO-FIX] Product ${product._id}: Detected image URL in video field: ${product.video.url}`);
        const imageUrl = product.video.url;
        
        // Get current images array
        const currentImages = product.images || [];
        const updatedImages = [...currentImages];
        if (!updatedImages.includes(imageUrl)) {
          updatedImages.push(imageUrl);
        }
        
        try {
          // Use $unset to properly remove the video field from MongoDB
          const updateResult = await Product.updateOne(
            { _id: product._id },
            { 
              $set: { images: updatedImages },
              $unset: { video: '' }
            }
          );
          
          console.log(`[AUTO-FIX] Product ${product._id}: Update result - modified: ${updateResult.modifiedCount}, matched: ${updateResult.matchedCount}`);
          
          if (updateResult.modifiedCount === 0) {
            console.warn(`[AUTO-FIX] WARNING: Product ${product._id} was not modified. This might indicate the product was already fixed or there's an issue.`);
          }
        } catch (error) {
          console.error(`[AUTO-FIX] ERROR fixing product ${product._id}:`, error);
        }
      }
    }
    
    // Re-fetch all products from DB after fixes (to ensure we return the corrected data)
    let finalProducts = products;
    if (productsToFix.length > 0) {
      console.log(`[AUTO-FIX] Re-fetching products after auto-fix (fixed ${productsToFix.length} products)`);
      try {
        // Re-fetch with the same query, sort, skip, and limit to maintain consistency
        const refreshedProducts = await Product.find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(parseInt(limit));
        
        // Verify the fix worked
        for (const refreshed of refreshedProducts) {
          if (productsToFix.some(id => id.toString() === refreshed._id.toString())) {
            if (refreshed.video && refreshed.video.url) {
              console.error(`[AUTO-FIX] ERROR: Product ${refreshed._id} still has video field after fix! Video:`, refreshed.video);
            } else {
              console.log(`[AUTO-FIX] SUCCESS: Product ${refreshed._id} video field cleared`);
            }
          }
        }
        
        // Create new array with refreshed data (don't modify the original)
        finalProducts = refreshedProducts;
        console.log(`[AUTO-FIX] Re-fetched ${finalProducts.length} products`);
      } catch (error) {
        console.error(`[AUTO-FIX] ERROR re-fetching products:`, error);
        // Fall back to original products if re-fetch fails
        finalProducts = products;
      }
    }

    const total = await Product.countDocuments(query);
    const categories = await Product.distinct('category', { seller: req.user._id });

    // Convert products to plain objects for JSON serialization
    const productsData = finalProducts.map(p => {
      const obj = p.toObject ? p.toObject() : p;
      // Forcefully remove video field if it exists and is empty/null/undefined
      if (obj.hasOwnProperty('video')) {
        if (!obj.video || obj.video === null || obj.video === undefined || 
            (typeof obj.video === 'object' && (!obj.video.url || obj.video.url === ''))) {
          delete obj.video;
        }
      }
      return obj;
    });
    
    // Debug: Log fixed products to verify video field is removed from response
    if (productsData.length > 0 && productsToFix.length > 0) {
      for (const productId of productsToFix) {
        const fixedProduct = productsData.find(p => p._id.toString() === productId.toString());
        if (fixedProduct) {
          const hasVideo = fixedProduct.hasOwnProperty('video');
          console.log(`[AUTO-FIX] Response check - Product ${fixedProduct._id}: has video field: ${hasVideo}, video value:`, fixedProduct.video);
          if (hasVideo && fixedProduct.video) {
            console.warn(`[AUTO-FIX] WARNING: Product ${fixedProduct._id} still has video field in response! Attempting to remove...`);
            delete fixedProduct.video;
            console.log(`[AUTO-FIX] Removed video field from response for product ${fixedProduct._id}`);
          }
        }
      }
    }

    res.json({
      products: productsData,
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

    // Handle images - either file uploads or image links
    if (req.files && req.files.images && req.files.images.length > 0) {
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
      
      newFileImages.push(...validImages);
    }
    
    // Handle image URLs (can be used alongside file uploads or alone)
    if (req.body.imageLinks !== undefined) {
      console.log('Create: Received imageLinks:', req.body.imageLinks, 'Type:', typeof req.body.imageLinks);
      console.log('Create: videoLink:', req.body.videoLink);
      try {
        let imageLinks;
        if (typeof req.body.imageLinks === 'string') {
          imageLinks = JSON.parse(req.body.imageLinks);
        } else if (Array.isArray(req.body.imageLinks)) {
          imageLinks = req.body.imageLinks;
        } else {
          imageLinks = [req.body.imageLinks];
        }
        
        console.log('Parsed imageLinks:', imageLinks);
        
        // Filter out empty strings
        imageLinks = imageLinks.filter(link => link && typeof link === 'string' && link.trim() !== '');
        
        // Validate URLs - accept HTTP/HTTPS URLs and base64 data URLs
        const validLinks = imageLinks.filter(link => {
          const trimmedLink = link.trim();
          // Check if it's a base64 data URL
          if (trimmedLink.startsWith('data:image/')) {
            return true;
          }
          // Check if it's a valid HTTP/HTTPS URL
          try {
            const url = new URL(trimmedLink);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        });
        
        console.log('Valid image links:', validLinks);
        
        // Only return error if user provided links but none were valid
        if (validLinks.length === 0 && imageLinks.length > 0) {
          return res.status(400).json({
            message: 'Invalid image URLs provided',
            error: 'Please provide valid HTTP/HTTPS image URLs or base64 data URLs (data:image/...)'
          });
        }
        
        // Always set images when imageLinks is provided (even if empty array)
        // If there are file uploads, combine them; otherwise use only URLs
        if (newFileImages.length > 0) {
          // Both file uploads and links - combine them
          productData.images = [...newFileImages, ...validLinks];
        } else {
          // Only URLs (or empty array to clear images)
          productData.images = validLinks;
        }
        
        console.log('Final productData.images:', productData.images);
      } catch (error) {
        console.error('Error parsing imageLinks:', error);
        return res.status(400).json({
          message: 'Invalid imageLinks format',
          error: 'imageLinks must be a valid JSON array of URLs'
        });
      }
    } else if (newFileImages.length > 0) {
      // Only file uploads, no imageLinks - use file uploads
      productData.images = newFileImages;
      console.log('Using only file uploads:', productData.images);
    } else {
      console.log('No imageLinks in request body. Body keys:', Object.keys(req.body));
    }

    // Handle video
    if (req.files && req.files.video) {
      productData.video = {
        type: 'file',
        url: `/uploads/products/videos/${req.files.video[0].filename}`
      };
    } else if (videoLink) {
      // Validate that videoLink is not an image URL
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
      if (imageExtensions.test(videoLink)) {
        console.warn('WARNING: Image URL detected in videoLink field:', videoLink);
        // If no images are set yet, automatically move the image URL to images array
        if (!productData.images || productData.images.length === 0) {
          console.log('Auto-correcting: Moving image URL from videoLink to images array');
          productData.images = [videoLink];
          // Don't set video field - user probably meant to use Image URLs section
        } else {
          return res.status(400).json({
            message: 'Invalid video URL',
            error: 'The video link appears to be an image URL. Please use the "Image URLs" section for images, or provide a valid video URL (YouTube, Vimeo, etc.)'
          });
        }
      } else {
        productData.video = {
          type: 'link',
          url: videoLink
        };
      }
    }

    // Ensure images array is initialized (even if empty)
    if (!productData.images) {
      productData.images = [];
    }

    const product = await Product.create(productData);

    console.log('Product created with images:', product.images);
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

    // Auto-fix: Check if existing product has image URL in video field
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    if (product.video && product.video.url && imageExtensions.test(product.video.url)) {
      console.log('Auto-fixing: Moving image URL from video field to images array for product:', product._id);
      const imageUrl = product.video.url;
      
      // Update images array
      if (!product.images || product.images.length === 0) {
        product.images = [imageUrl];
      } else if (!product.images.includes(imageUrl)) {
        product.images.push(imageUrl);
      }
      
      // Use $unset to properly remove the video field from MongoDB
      await Product.updateOne(
        { _id: product._id },
        { 
          $set: { images: product.images },
          $unset: { video: '' }
        }
      );
      
      // Refresh product from DB to get updated data
      const refreshedProduct = await Product.findById(product._id);
      Object.assign(product, refreshedProduct.toObject());
      
      console.log('Fixed: Image URL moved from video to images, video field cleared');
    }

    const updates = { ...req.body };
    
    // Debug: Log all received fields
    console.log('Update request body keys:', Object.keys(req.body));
    console.log('Update request videoLink:', req.body.videoLink, 'Type:', typeof req.body.videoLink);
    console.log('Update request has videoLink:', req.body.hasOwnProperty('videoLink'));
    console.log('Product current video:', product.video);

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

    // Handle new images - either file uploads or image links
    const newFileImages = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
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
      
      newFileImages.push(...validImages);
    }
    
    // Handle image URLs (can be used alongside file uploads or alone)
    if (updates.imageLinks !== undefined) {
      console.log('Update: Received imageLinks:', updates.imageLinks, 'Type:', typeof updates.imageLinks);
      try {
        let imageLinks;
        if (typeof updates.imageLinks === 'string') {
          imageLinks = JSON.parse(updates.imageLinks);
        } else if (Array.isArray(updates.imageLinks)) {
          imageLinks = updates.imageLinks;
        } else {
          imageLinks = [updates.imageLinks];
        }
        
        console.log('Update: Parsed imageLinks:', imageLinks);
        
        // Filter out empty strings
        imageLinks = imageLinks.filter(link => link && typeof link === 'string' && link.trim() !== '');
        
        // Validate URLs - accept HTTP/HTTPS URLs and base64 data URLs
        const validLinks = imageLinks.filter(link => {
          const trimmedLink = link.trim();
          // Check if it's a base64 data URL
          if (trimmedLink.startsWith('data:image/')) {
            return true;
          }
          // Check if it's a valid HTTP/HTTPS URL
          try {
            const url = new URL(trimmedLink);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        });
        
        console.log('Update: Valid image links:', validLinks);
        
        if (validLinks.length === 0 && imageLinks.length > 0) {
          return res.status(400).json({
            message: 'Invalid image URLs provided',
            error: 'Please provide valid HTTP/HTTPS image URLs'
          });
        }
        
        // If imageLinks is provided and no files, replace all images; otherwise append
        if (newFileImages.length > 0) {
          // Both files and links - append to existing
          updates.images = [...(product.images || []), ...newFileImages, ...validLinks];
        } else if (validLinks.length > 0) {
          // Only links - replace all images
          updates.images = validLinks;
        } else {
          // Empty imageLinks array means user wants to clear images
          updates.images = [];
        }
        
        console.log('Update: Final updates.images:', updates.images);
        delete updates.imageLinks;
      } catch (error) {
        console.error('Error parsing imageLinks:', error);
        return res.status(400).json({
          message: 'Invalid imageLinks format',
          error: 'imageLinks must be a valid JSON array of URLs'
        });
      }
    } else if (newFileImages.length > 0) {
      // Only file uploads, no links - append to existing
      updates.images = [...(product.images || []), ...newFileImages];
    }
    // If neither imageLinks nor new files, keep existing images (don't set updates.images)

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
    } else if (updates.hasOwnProperty('videoLink') || req.body.videoLink !== undefined) {
      // videoLink is explicitly provided (even if empty string) - handle it
      // Note: FormData might send empty string, so check both hasOwnProperty and !== undefined
      const videoLinkValue = (updates.videoLink || req.body.videoLink || '').toString().trim();
      console.log('Received videoLink:', videoLinkValue, 'Raw:', updates.videoLink, 'Type:', typeof updates.videoLink);
      
      if (!videoLinkValue) {
        // Empty videoLink means user wants to clear the video field
        // Use $unset to properly remove the field from MongoDB
        if (!updates.$unset) updates.$unset = {};
        updates.$unset.video = '';
        console.log('Clearing video field - videoLink is empty');
      } else {
        // Validate that videoLink is not an image URL
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
        if (imageExtensions.test(videoLinkValue)) {
          console.warn('WARNING: Image URL detected in videoLink field:', videoLinkValue);
          // If no images are being updated, automatically move the image URL to images array
          if (!updates.images || (Array.isArray(updates.images) && updates.images.length === 0)) {
            console.log('Auto-correcting: Moving image URL from videoLink to images array');
            updates.images = [videoLinkValue];
            // Clear video field using $unset
            if (!updates.$unset) updates.$unset = {};
            updates.$unset.video = '';
          } else {
            return res.status(400).json({
              message: 'Invalid video URL',
              error: 'The video link appears to be an image URL. Please use the "Image URLs" section for images, or provide a valid video URL (YouTube, Vimeo, etc.)'
            });
          }
        } else {
          updates.video = {
            type: 'link',
            url: videoLinkValue
          };
        }
      }
      delete updates.videoLink;
    }

    // Handle $unset separately if present (for clearing fields)
    if (updates.$unset) {
      const unsetFields = updates.$unset;
      console.log('Unsetting fields:', unsetFields);
      delete updates.$unset;
      const unsetResult = await Product.updateOne({ _id: req.params.id }, { $unset: unsetFields });
      console.log('Unset result:', unsetResult);
    }

    console.log('Final updates object (before save):', JSON.stringify(updates, null, 2));

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    console.log('Updated product video field:', updatedProduct.video);

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

// Fix product with image URL in video field (manual fix endpoint)
router.post('/:id/fix-video', protect, sellerOnly, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    
    if (product.video && product.video.url && imageExtensions.test(product.video.url)) {
      const imageUrl = product.video.url;
      const currentImages = product.images || [];
      const updatedImages = [...currentImages];
      if (!updatedImages.includes(imageUrl)) {
        updatedImages.push(imageUrl);
      }
      
      // Use $unset to properly remove the video field
      const updateResult = await Product.updateOne(
        { _id: product._id },
        { 
          $set: { images: updatedImages },
          $unset: { video: '' }
        }
      );
      
      // Refresh product
      const fixedProduct = await Product.findById(product._id);
      
      return res.json({
        message: 'Product fixed successfully',
        product: fixedProduct,
        updateResult: {
          modified: updateResult.modifiedCount,
          matched: updateResult.matchedCount
        }
      });
    } else {
      return res.json({
        message: 'Product does not need fixing',
        product: product
      });
    }
  } catch (error) {
    console.error('Error fixing product:', error);
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

