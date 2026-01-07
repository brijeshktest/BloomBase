const express = require('express');
const XLSX = require('xlsx');
const multer = require('multer');
const Product = require('../models/Product');
const { protect, sellerOnly, checkTrial } = require('../middleware/auth');
const { createUniqueSlug } = require('../utils/slugify');

// Configure multer for Excel files (memory storage)
const excelStorage = multer.memoryStorage();
const excelUpload = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xlsx|xls/;
    const extname = file.originalname.toLowerCase().match(/\.([^.]+)$/)?.[1];
    const mimetype = file.mimetype;
    
    if (allowedTypes.test(extname) || 
        mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max for Excel files
  }
});

const router = express.Router();

// Download sample Excel template
router.get('/sample', protect, sellerOnly, (req, res) => {
  try {
    // Create sample data
    const sampleData = [
      {
        'Product Name': 'Sample Product 1',
        'Description': 'This is a sample product description',
        'Category': 'Food',
        'Base Price (₹)': 100,
        'Minimum Order Quantity': 1,
        'Stock': 50,
        'Unit': 'piece',
        'Tags': 'organic, fresh, handmade'
      },
      {
        'Product Name': 'Sample Product 2',
        'Description': 'Another sample product description',
        'Category': 'Clothing',
        'Base Price (₹)': 500,
        'Minimum Order Quantity': 2,
        'Stock': 30,
        'Unit': 'piece',
        'Tags': 'cotton, comfortable'
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Product Name
      { wch: 40 }, // Description
      { wch: 15 }, // Category
      { wch: 15 }, // Base Price
      { wch: 20 }, // Minimum Order Quantity
      { wch: 10 }, // Stock
      { wch: 10 }, // Unit
      { wch: 30 }  // Tags
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="bloombase-product-template.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate sample file', error: error.message });
  }
});

// Bulk upload products from Excel
router.post('/products', protect, sellerOnly, checkTrial, excelUpload.single('excel'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No Excel file uploaded' });
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const results = {
      success: [],
      errors: []
    };

    // Required fields mapping
    const fieldMapping = {
      'Product Name': 'name',
      'Description': 'description',
      'Category': 'category',
      'Base Price (₹)': 'basePrice',
      'Minimum Order Quantity': 'minimumOrderQuantity',
      'Stock': 'stock',
      'Unit': 'unit',
      'Tags': 'tags'
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 because Excel is 1-indexed and has header

      try {
        // Map fields
        const productData = {
          seller: req.user._id,
          name: row['Product Name'] || row['product name'] || row['ProductName'],
          description: row['Description'] || row['description'],
          category: row['Category'] || row['category'],
          basePrice: parseFloat(row['Base Price (₹)'] || row['Base Price'] || row['basePrice'] || row['Base Price (INR)']),
          minimumOrderQuantity: parseInt(row['Minimum Order Quantity'] || row['minimumOrderQuantity'] || row['MOQ'] || 1),
          stock: parseInt(row['Stock'] || row['stock'] || 0),
          unit: (row['Unit'] || row['unit'] || 'piece').toLowerCase(),
          tags: row['Tags'] || row['tags'] ? String(row['Tags'] || row['tags']).split(',').map(t => t.trim()) : [],
          isActive: true
        };

        // Validation
        if (!productData.name || !productData.description || !productData.category) {
          results.errors.push({
            row: rowNum,
            error: 'Missing required fields: Product Name, Description, or Category'
          });
          continue;
        }

        if (!productData.basePrice || isNaN(productData.basePrice) || productData.basePrice <= 0) {
          results.errors.push({
            row: rowNum,
            error: 'Invalid or missing Base Price'
          });
          continue;
        }

        // Validate unit
        const validUnits = ['piece', 'kg', 'gram', 'liter', 'ml', 'dozen', 'pack'];
        if (!validUnits.includes(productData.unit)) {
          productData.unit = 'piece';
        }

        // Create slug
        productData.slug = await createUniqueSlug(Product, productData.name, req.user._id);

        // Set defaults
        if (!productData.minimumOrderQuantity || isNaN(productData.minimumOrderQuantity)) {
          productData.minimumOrderQuantity = 1;
        }
        if (!productData.stock || isNaN(productData.stock)) {
          productData.stock = 0;
        }

        // Create product
        const product = await Product.create(productData);

        results.success.push({
          row: rowNum,
          productId: product._id,
          name: product.name
        });
      } catch (error) {
        results.errors.push({
          row: rowNum,
          error: error.message || 'Failed to create product'
        });
      }
    }

    res.json({
      message: `Processed ${data.length} products`,
      success: results.success.length,
      errors: results.errors.length,
      details: results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to process Excel file', error: error.message });
  }
});

module.exports = router;

