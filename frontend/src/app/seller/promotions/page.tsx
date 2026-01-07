'use client';

import { useEffect, useState } from 'react';
import { promotionApi, productApi } from '@/lib/api';
import { Promotion, Product } from '@/types';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Tag, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  X,
  Percent,
  DollarSign,
  Calendar
} from 'lucide-react';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'absolute',
    discountValue: '',
    applyToAll: false,
    products: [] as string[],
    startDate: '',
    endDate: '',
    code: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [promoRes, productsRes] = await Promise.all([
        promotionApi.getAll(),
        productApi.getMyProducts({ limit: '100' }),
      ]);
      setPromotions(promoRes.data);
      setProducts(productsRes.data.products);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditing(null);
    setFormData({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      applyToAll: false,
      products: [],
      startDate: '',
      endDate: '',
      code: '',
    });
    setShowModal(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditing(promo);
    setFormData({
      name: promo.name,
      description: promo.description || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      applyToAll: promo.applyToAll,
      products: promo.products.map(p => typeof p === 'string' ? p : p._id),
      startDate: new Date(promo.startDate).toISOString().slice(0, 16),
      endDate: new Date(promo.endDate).toISOString().slice(0, 16),
      code: promo.code || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      if (editing) {
        await promotionApi.update(editing._id, data);
        toast.success('Promotion updated');
      } else {
        await promotionApi.create(data);
        toast.success('Promotion created');
      }

      setShowModal(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save promotion');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (promo: Promotion) => {
    try {
      await promotionApi.toggle(promo._id);
      toast.success(`Promotion ${promo.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update promotion');
    }
  };

  const handleDelete = async (promo: Promotion) => {
    if (!confirm(`Delete "${promo.name}"? This cannot be undone.`)) return;
    
    try {
      await promotionApi.delete(promo._id);
      toast.success('Promotion deleted');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete promotion');
    }
  };

  const getStatus = (promo: Promotion) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);

    if (!promo.isActive) return { label: 'Inactive', class: 'badge-danger' };
    if (now < start) return { label: 'Upcoming', class: 'badge-info' };
    if (now > end) return { label: 'Expired', class: 'badge-warning' };
    return { label: 'Active', class: 'badge-success' };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Promotions</h1>
          <p className="text-zinc-600">Create and manage sales promotions</p>
        </div>
        <button onClick={openNewModal} className="btn btn-primary">
          <Plus size={20} />
          Create Promotion
        </button>
      </div>

      {/* Promotions List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading...</div>
      ) : promotions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-zinc-100">
          <Tag className="mx-auto text-zinc-300 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No promotions yet</h3>
          <p className="text-zinc-600 mb-4">Create your first promotion to boost sales</p>
          <button onClick={openNewModal} className="btn btn-primary">
            <Plus size={20} />
            Create Promotion
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((promo) => {
            const status = getStatus(promo);
            return (
              <div key={promo._id} className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-zinc-900">{promo.name}</h3>
                      <span className={`badge ${status.class}`}>{status.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
                      <span className="flex items-center gap-1">
                        {promo.discountType === 'percentage' ? (
                          <><Percent size={16} /> {promo.discountValue}% off</>
                        ) : (
                          <><DollarSign size={16} /> ₹{promo.discountValue} off</>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                      </span>
                      <span>
                        {promo.applyToAll ? 'All products' : `${promo.products.length} products`}
                      </span>
                      {promo.code && (
                        <span className="font-mono bg-zinc-100 px-2 py-1 rounded">
                          {promo.code}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(promo)}
                      className="btn btn-secondary py-2"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggle(promo)}
                      className="p-2 rounded-xl hover:bg-zinc-100"
                    >
                      {promo.isActive ? (
                        <ToggleRight size={24} className="text-emerald-600" />
                      ) : (
                        <ToggleLeft size={24} className="text-zinc-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(promo)}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-600"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Promotion Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editing ? 'Edit Promotion' : 'Create Promotion'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-zinc-100 rounded-xl"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="form-label">Promotion Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Winter Sale"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Discount Type</label>
                  <select
                    className="form-input"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'absolute' })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="absolute">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Discount Value *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max={formData.discountType === 'percentage' ? 100 : undefined}
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Date *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">End Date *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Promo Code (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., WINTER20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
                    checked={formData.applyToAll}
                    onChange={(e) => setFormData({ ...formData, applyToAll: e.target.checked })}
                  />
                  <span className="font-medium">Apply to all products</span>
                </label>
              </div>

              {!formData.applyToAll && (
                <div>
                  <label className="form-label">Select Products</label>
                  <div className="max-h-48 overflow-y-auto border border-zinc-200 rounded-xl p-2 space-y-1">
                    {products.map((product) => (
                      <label key={product._id} className="flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-zinc-300 text-cyan-600"
                          checked={formData.products.includes(product._id)}
                          onChange={(e) => {
                            const prods = e.target.checked
                              ? [...formData.products, product._id]
                              : formData.products.filter(id => id !== product._id);
                            setFormData({ ...formData, products: prods });
                          }}
                        />
                        <span className="text-sm">{product.name}</span>
                        <span className="text-xs text-zinc-500 ml-auto">₹{product.basePrice}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

