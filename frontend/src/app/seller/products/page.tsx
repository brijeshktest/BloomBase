'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productApi, bulkUploadApi } from '@/lib/api';
import { Product } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Package, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  X,
  Upload,
  Link as LinkIcon,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
  PackagePlus
} from 'lucide-react';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    basePrice: '',
    minimumOrderQuantity: '1',
    stock: '0',
    unit: 'piece',
    tags: '',
    videoLink: '',
    metaTitle: '',
    metaDescription: '',
    priceTiers: [] as { minQuantity: string; maxQuantity: string; price: string }[],
  });
  const [images, setImages] = useState<File[]>([]);
  const [imageLinks, setImageLinks] = useState<string[]>(['']);
  const [imageType, setImageType] = useState<'file' | 'link'>('file');
  const [video, setVideo] = useState<File | null>(null);
  const [videoType, setVideoType] = useState<'file' | 'link'>('link');
  const [saving, setSaving] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    errors: number;
    details?: any;
  } | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const [stockIncrease, setStockIncrease] = useState('1');
  const [increasingStock, setIncreasingStock] = useState(false);

  useEffect(() => {
    if (searchParams?.get('action') === 'new') {
      setShowModal(true);
    }
    fetchProducts();
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      
      const response = await productApi.getMyProducts(params);
      setProducts(response.data.products);
      setCategories(response.data.categories);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      basePrice: '',
      minimumOrderQuantity: '1',
      stock: '0',
      unit: 'piece',
      tags: '',
      videoLink: '',
      metaTitle: '',
      metaDescription: '',
      priceTiers: [],
    });
    setImages([]);
    setImageLinks(['']);
    setImageType('file');
    setVideo(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      basePrice: product.basePrice.toString(),
      minimumOrderQuantity: product.minimumOrderQuantity.toString(),
      stock: product.stock.toString(),
      unit: product.unit,
      tags: product.tags.join(', '),
      videoLink: product.video?.type === 'link' ? product.video.url : '',
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      priceTiers: product.priceTiers.map(t => ({
        minQuantity: t.minQuantity.toString(),
        maxQuantity: t.maxQuantity?.toString() || '',
        price: t.price.toString(),
      })),
    });
    setVideoType(product.video?.type || 'link');
    setImages([]);
    // Check if existing images are URLs or file paths (including base64 data URLs)
    const existingImageLinks = product.images.filter(img => 
      img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:image/')
    );
    if (existingImageLinks.length > 0) {
      setImageType('link');
      setImageLinks(existingImageLinks.length > 0 ? existingImageLinks : ['']);
    } else {
      setImageType('file');
      setImageLinks(['']);
    }
    setVideo(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isApproved) {
      toast.error('Your account is pending approval');
      return;
    }
    setSaving(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('basePrice', formData.basePrice);
      data.append('minimumOrderQuantity', formData.minimumOrderQuantity);
      data.append('stock', formData.stock);
      data.append('unit', formData.unit);
      data.append('tags', formData.tags);
      data.append('metaTitle', formData.metaTitle);
      data.append('metaDescription', formData.metaDescription);
      
      if (formData.priceTiers.length > 0) {
        const tiers = formData.priceTiers.map(t => ({
          minQuantity: parseInt(t.minQuantity),
          maxQuantity: t.maxQuantity ? parseInt(t.maxQuantity) : undefined,
          price: parseFloat(t.price),
        }));
        data.append('priceTiers', JSON.stringify(tiers));
      }

      // Always send videoLink when in link mode (even if empty) to allow clearing
      // Also send empty string if switching from link to file mode to clear existing video link
      if (videoType === 'link') {
        data.append('videoLink', formData.videoLink || '');
      } else if (editingProduct && editingProduct.video?.type === 'link') {
        // If switching from link mode to file mode, send empty videoLink to clear the existing link
        data.append('videoLink', '');
      }

      // Handle images based on type
      if (imageType === 'file') {
        images.forEach(img => data.append('images', img));
      } else {
        // Filter out empty image links
        const validImageLinks = imageLinks.filter(link => link.trim() !== '');
        // Always send imageLinks when in link mode (even if empty array) so backend knows to replace images
        data.append('imageLinks', JSON.stringify(validImageLinks));
      }
      
      if (video) data.append('video', video);

      if (editingProduct) {
        await productApi.updateProduct(editingProduct._id, data);
        toast.success('Product updated');
      } else {
        await productApi.createProduct(data);
        toast.success('Product created');
      }

      setShowModal(false);
      fetchProducts();
      router.push('/seller/products');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (product: Product) => {
    try {
      await productApi.toggleProduct(product._id);
      toast.success(`Product ${product.isActive ? 'disabled' : 'enabled'}`);
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update product');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    
    try {
      await productApi.deleteProduct(product._id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete product');
    }
  };

  const addPriceTier = () => {
    setFormData({
      ...formData,
      priceTiers: [...formData.priceTiers, { minQuantity: '', maxQuantity: '', price: '' }],
    });
  };

  const removePriceTier = (index: number) => {
    const tiers = [...formData.priceTiers];
    tiers.splice(index, 1);
    setFormData({ ...formData, priceTiers: tiers });
  };

  const updatePriceTier = (index: number, field: string, value: string) => {
    const tiers = [...formData.priceTiers];
    tiers[index] = { ...tiers[index], [field]: value };
    setFormData({ ...formData, priceTiers: tiers });
  };

  const openStockModal = (product: Product) => {
    setSelectedProductForStock(product);
    setStockIncrease('1');
    setShowStockModal(true);
  };

  const handleIncreaseStock = async () => {
    if (!selectedProductForStock) return;
    
    const quantity = parseInt(stockIncrease);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setIncreasingStock(true);
    try {
      await productApi.increaseStock(selectedProductForStock._id, quantity);
      toast.success(`Added ${quantity} items to inventory`);
      setShowStockModal(false);
      fetchProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to increase stock');
    } finally {
      setIncreasingStock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Products</h1>
          <p className="text-zinc-600">Manage your product catalog</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowBulkUpload(true)} 
            className="relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
          >
            <FileSpreadsheet size={20} className="group-hover:scale-110 transition-transform" />
            <span>Bulk Upload</span>
            <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
              FAST
            </span>
          </button>
          <button onClick={openNewProductModal} className="btn btn-primary">
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              className="form-input pl-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input sm:w-48"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-zinc-100">
          <Package className="mx-auto text-zinc-300 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No products yet</h3>
          <p className="text-zinc-600 mb-4">Start by adding your first product</p>
          <button onClick={openNewProductModal} className="btn btn-primary">
            <Plus size={20} />
            Add Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden card-hover">
              <div className="aspect-square bg-zinc-100 relative">
                {product.images && product.images.length > 0 && product.images[0] ? (
                  <img
                    src={
                      product.images[0].startsWith('http://') || product.images[0].startsWith('https://') || product.images[0].startsWith('data:image/')
                        ? product.images[0]
                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${product.images[0]}`
                    }
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f4f4f5" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23a1a1aa"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <Package size={32} />
                  </div>
                )}
                <span className={`absolute top-2 right-2 badge text-xs ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm text-zinc-900 truncate">{product.name}</h3>
                <p className="text-xs text-zinc-600 mt-0.5 truncate">{product.category}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-base font-bold text-cyan-600">₹{product.basePrice}</span>
                  <span className="text-xs text-zinc-500">MOQ: {product.minimumOrderQuantity}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5">
                    <Package size={14} className="text-zinc-400" />
                    <span className={`text-xs font-medium ${(product.stock || 0) === 0 ? 'text-red-600' : 'text-zinc-600'}`}>
                      Stock: {product.stock || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => openStockModal(product)}
                    className="p-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-600 transition-colors"
                    title="Quick add stock"
                  >
                    <PackagePlus size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-zinc-100">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 btn btn-secondary py-1.5 text-xs"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggle(product)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100"
                    title={product.isActive ? 'Disable' : 'Enable'}
                  >
                    {product.isActive ? (
                      <ToggleRight size={18} className="text-emerald-600" />
                    ) : (
                      <ToggleLeft size={18} className="text-zinc-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-zinc-100 rounded-xl"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-input min-h-[100px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Food, Clothing, Home Decor"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="form-label">Base Price (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Minimum Order Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={formData.minimumOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, minimumOrderQuantity: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Unit</label>
                  <select
                    className="form-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram</option>
                    <option value="gram">Gram</option>
                    <option value="liter">Liter</option>
                    <option value="ml">Milliliter</option>
                    <option value="dozen">Dozen</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="organic, handmade, fresh"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>

              {/* Price Tiers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="form-label mb-0">Volume Pricing (Optional)</label>
                  <button type="button" onClick={addPriceTier} className="text-sm text-cyan-600 hover:text-cyan-700">
                    + Add Tier
                  </button>
                </div>
                
                {/* Pricing Tiers Guide */}
                <div className="mb-4 p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info className="text-cyan-600 mt-0.5 flex-shrink-0" size={18} />
                    <div className="flex-1 text-sm text-zinc-700">
                      <p className="font-semibold text-cyan-900 mb-1">How Volume Pricing Works:</p>
                      <ul className="list-disc list-inside space-y-1 text-zinc-600">
                        <li>Set different prices based on the quantity buyers purchase</li>
                        <li><strong>Base Price</strong> applies when no tiers match the order quantity</li>
                        <li><strong>Min Qty</strong> is the minimum quantity required for this tier</li>
                        <li><strong>Max Qty</strong> (optional) sets the upper limit - leave empty for unlimited</li>
                        <li>Example: Buy 1-9 items at ₹100, 10-49 items at ₹90, 50+ items at ₹80</li>
                      </ul>
                    </div>
                  </div>
                </div>
                {formData.priceTiers.map((tier, index) => (
                  <div key={index} className="flex gap-3 mb-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500">Min Qty</label>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        placeholder="10"
                        value={tier.minQuantity}
                        onChange={(e) => updatePriceTier(index, 'minQuantity', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500">Max Qty</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Optional"
                        value={tier.maxQuantity}
                        onChange={(e) => updatePriceTier(index, 'maxQuantity', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500">Price (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        min="0"
                        step="0.01"
                        placeholder="90"
                        value={tier.price}
                        onChange={(e) => updatePriceTier(index, 'price', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePriceTier(index)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
                {formData.priceTiers.length === 0 && (
                  <p className="text-sm text-zinc-500 italic">
                    Add price tiers to offer discounts for bulk purchases
                  </p>
                )}
              </div>

              {/* Images */}
              <div>
                <label className="form-label">Product Images (Up to 10 images)</label>
                <div className="flex gap-4 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageType('file')}
                    className={`flex-1 py-2 px-4 rounded-xl border ${
                      imageType === 'file' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-zinc-200'
                    }`}
                  >
                    <Upload size={16} className="inline mr-2" />
                    Upload Files
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageType('link')}
                    className={`flex-1 py-2 px-4 rounded-xl border ${
                      imageType === 'link' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-zinc-200'
                    }`}
                  >
                    <LinkIcon size={16} className="inline mr-2" />
                    Image URLs
                  </button>
                </div>
                
                {imageType === 'file' ? (
                  <>
                    <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center">
                      <Upload className="mx-auto text-zinc-400 mb-2" size={32} />
                      <p className="text-sm text-zinc-600 mb-2">Click or drag images here</p>
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="w-full"
                        onChange={(e) => setImages(Array.from(e.target.files || []))}
                      />
                      <p className="text-xs text-zinc-500 mt-3">
                        Recommended: 1200×1200px, Square, Max 5MB per image
                        <br />
                        <span className="text-zinc-400">Accepted: 400×400 to 2400×2400px (near square)</span>
                      </p>
                    </div>
                    {images.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Preview ${idx + 1}`}
                              className="w-20 h-20 rounded-lg object-cover border-2 border-zinc-200"
                            />
                            <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      {imageLinks.map((link, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="url"
                            className="form-input flex-1"
                            placeholder="https://example.com/image.jpg"
                            value={link}
                            onChange={(e) => {
                              const newLinks = [...imageLinks];
                              newLinks[idx] = e.target.value;
                              setImageLinks(newLinks);
                            }}
                          />
                          {imageLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = imageLinks.filter((_, i) => i !== idx);
                                setImageLinks(newLinks.length > 0 ? newLinks : ['']);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                            >
                              <X size={20} />
                            </button>
                          )}
                        </div>
                      ))}
                      {imageLinks.length < 10 && (
                        <button
                          type="button"
                          onClick={() => setImageLinks([...imageLinks, ''])}
                          className="text-sm text-cyan-600 hover:text-cyan-700"
                        >
                          + Add Another Image URL
                        </button>
                      )}
                    </div>
                    {imageLinks.filter(l => l.trim() !== '').length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {imageLinks.filter(l => l.trim() !== '').map((link, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={link}
                              alt={`Preview ${idx + 1}`}
                              className="w-20 h-20 rounded-lg object-cover border-2 border-zinc-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f4f4f5" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23a1a1aa" font-size="10"%3EInvalid URL%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                
                {editingProduct && editingProduct.images.length > 0 && imageType === 'file' && (
                  <div className="mt-3">
                    <p className="text-xs text-zinc-500 mb-2">Existing Images:</p>
                    <div className="flex gap-2 flex-wrap">
                      {editingProduct.images.map((img, idx) => {
                        const imgUrl = img.startsWith('http://') || img.startsWith('https://') 
                          ? img 
                          : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${img}`;
                        return (
                          <div key={idx} className="relative">
                            <img
                              src={imgUrl}
                              alt={`Existing ${idx + 1}`}
                              className="w-20 h-20 rounded-lg object-cover border-2 border-zinc-200"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Video */}
              <div>
                <label className="form-label">Product Video (Optional)</label>
                <div className="flex gap-4 mb-3">
                  <button
                    type="button"
                    onClick={() => setVideoType('link')}
                    className={`flex-1 py-2 px-4 rounded-xl border ${
                      videoType === 'link' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-zinc-200'
                    }`}
                  >
                    <LinkIcon size={16} className="inline mr-2" />
                    Video Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoType('file')}
                    className={`flex-1 py-2 px-4 rounded-xl border ${
                      videoType === 'file' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-zinc-200'
                    }`}
                  >
                    <Upload size={16} className="inline mr-2" />
                    Upload File
                  </button>
                </div>
                {videoType === 'link' ? (
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.videoLink}
                    onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                  />
                ) : (
                  <input
                    type="file"
                    accept="video/*"
                    className="form-input"
                    onChange={(e) => setVideo(e.target.files?.[0] || null)}
                  />
                )}
              </div>

              {/* SEO */}
              <div className="pt-4 border-t border-zinc-100">
                <h3 className="font-semibold text-zinc-900 mb-4">SEO Settings (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Meta Title</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Leave empty to use product name"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Meta Description</label>
                    <textarea
                      className="form-input"
                      placeholder="Leave empty to use product description"
                      maxLength={160}
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-zinc-100 flex gap-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Bulk Upload Products</h2>
              <button
                onClick={() => {
                  setShowBulkUpload(false);
                  setExcelFile(null);
                  setUploadResult(null);
                }}
                className="p-2 hover:bg-zinc-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                <h3 className="font-semibold text-cyan-900 mb-2">How to use Bulk Upload:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-cyan-800">
                  <li>Download the sample Excel template</li>
                  <li>Fill in your product details (required fields: Product Name, Description, Category, Base Price)</li>
                  <li>Upload the completed Excel file</li>
                  <li>Add images and videos later by editing individual products</li>
                </ol>
              </div>

              {/* Download Sample */}
              <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center">
                <FileSpreadsheet className="mx-auto text-zinc-400 mb-3" size={48} />
                <h3 className="font-semibold text-zinc-900 mb-2">Download Sample Template</h3>
                <p className="text-sm text-zinc-600 mb-4">
                  Get the Excel template with required columns and sample data
                </p>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/bulk-upload/sample`}
                  download="selllocalonline-product-template.xlsx"
                  className="btn btn-secondary inline-flex items-center justify-center"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/bulk-upload/sample`,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'selllocalonline-product-template.xlsx';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      toast.success('Template downloaded');
                    } catch (error) {
                      console.error(error);
                      toast.error('Failed to download template');
                    }
                  }}
                >
                  <Download size={20} />
                  Download Template
                </a>
              </div>

              {/* Upload File */}
              <div>
                <label className="form-label">Upload Excel File</label>
                <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center">
                  <Upload className="mx-auto text-zinc-400 mb-2" size={32} />
                  <p className="text-sm text-zinc-600 mb-2">
                    {excelFile ? excelFile.name : 'Click or drag Excel file here'}
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="w-full"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-zinc-500 mt-2">
                    Supported formats: .xlsx, .xls (Max 10MB)
                  </p>
                </div>
              </div>

              {/* Upload Results */}
              {uploadResult && (
                <div className={`rounded-xl p-4 ${
                  uploadResult.errors === 0 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {uploadResult.errors === 0 ? (
                      <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                    ) : (
                      <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                    )}
                    <div className="flex-grow">
                      <p className="font-semibold mb-2">
                        {uploadResult.errors === 0 
                          ? 'All products uploaded successfully!' 
                          : 'Upload completed with some errors'}
                      </p>
                      <div className="text-sm space-y-1">
                        <p>✅ Successfully uploaded: {uploadResult.success}</p>
                        {uploadResult.errors > 0 && (
                          <p>❌ Errors: {uploadResult.errors}</p>
                        )}
                      </div>
                      {uploadResult.details?.errors && uploadResult.details.errors.length > 0 && (
                        <div className="mt-3 max-h-40 overflow-y-auto">
                          <p className="text-xs font-semibold mb-1">Error Details:</p>
                          {uploadResult.details.errors.map((err: any, idx: number) => (
                            <p key={idx} className="text-xs">
                              Row {err.row}: {err.error}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-100 flex gap-4 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => {
                  setShowBulkUpload(false);
                  setExcelFile(null);
                  setUploadResult(null);
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!excelFile) {
                    toast.error('Please select an Excel file');
                    return;
                  }

                  setUploading(true);
                  setUploadResult(null);

                  try {
                    const response = await bulkUploadApi.uploadProducts(excelFile);
                    setUploadResult({
                      success: response.data.success,
                      errors: response.data.errors,
                      details: response.data.details
                    });
                    
                    if (response.data.success > 0) {
                      toast.success(`${response.data.success} products uploaded successfully!`);
                      fetchProducts();
                    }
                    
                    if (response.data.errors > 0) {
                      toast.error(`${response.data.errors} products failed to upload`);
                    }
                  } catch (error: unknown) {
                    const err = error as { response?: { data?: { message?: string } } };
                    toast.error(err.response?.data?.message || 'Failed to upload products');
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={!excelFile || uploading}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload Products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stock Increase Modal */}
      {showStockModal && selectedProductForStock && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900">Increase Inventory</h2>
              <p className="text-sm text-zinc-600 mt-1">{selectedProductForStock.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="form-label">Current Stock</label>
                <div className="text-2xl font-bold text-zinc-900">
                  {selectedProductForStock.stock || 0} {selectedProductForStock.unit}
                </div>
              </div>
              <div>
                <label className="form-label">Add Quantity *</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={stockIncrease}
                  onChange={(e) => setStockIncrease(e.target.value)}
                  placeholder="Enter quantity to add"
                  autoFocus
                />
                <p className="text-xs text-zinc-500 mt-1">
                  New stock will be: {(selectedProductForStock.stock || 0) + parseInt(stockIncrease || '0')} {selectedProductForStock.unit}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-100 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowStockModal(false);
                  setSelectedProductForStock(null);
                  setStockIncrease('1');
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleIncreaseStock}
                disabled={increasingStock || !stockIncrease || parseInt(stockIncrease) <= 0}
                className="flex-1 btn btn-primary"
              >
                {increasingStock ? 'Adding...' : 'Add to Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-zinc-500">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

