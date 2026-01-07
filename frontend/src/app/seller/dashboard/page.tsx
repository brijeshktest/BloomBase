'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { productApi } from '@/lib/api';
import { Product } from '@/types';
import { Package, Eye, TrendingUp, Clock, Plus, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerDashboard() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productApi.getMyProducts({ limit: '5' });
      setProducts(response.data.products);
      
      const allProducts = await productApi.getMyProducts({ limit: '1000' });
      const all = allProducts.data.products;
      setStats({
        total: all.length,
        active: all.filter((p: Product) => p.isActive).length,
        inactive: all.filter((p: Product) => !p.isActive).length,
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const daysUntilTrialEnds = () => {
    if (!user?.trialEndsAt) return null;
    const end = new Date(user.trialEndsAt);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const trialDays = daysUntilTrialEnds();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-600">Welcome back, {user?.name}</p>
        </div>
        <Link
          href="/seller/products?action=new"
          className="btn btn-primary"
        >
          <Plus size={20} />
          Add Product
        </Link>
      </div>

      {/* Trial Warning */}
      {trialDays !== null && trialDays <= 7 && trialDays > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center space-x-3">
          <Clock className="text-amber-600 flex-shrink-0" size={24} />
          <div>
            <p className="font-semibold text-amber-800">Trial ending soon!</p>
            <p className="text-sm text-amber-700">
              Your trial ends in {trialDays} day{trialDays !== 1 ? 's' : ''}. Contact support to continue.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-600 text-sm">Total Products</p>
              <p className="text-3xl font-bold text-zinc-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Package className="text-cyan-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-600 text-sm">Active Products</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Eye className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-600 text-sm">Inactive Products</p>
              <p className="text-3xl font-bold text-zinc-400 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-zinc-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Store Link */}
      {user?.alias && (
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Your Store is Live!</h3>
              <p className="text-cyan-100 mt-1">
                Share this link with your customers
              </p>
              <p className="mt-2 font-mono bg-white/20 px-3 py-1 rounded-lg inline-block text-sm">
                {typeof window !== 'undefined' ? window.location.origin : ''}/store/{user.alias}
              </p>
            </div>
            <Link
              href={`/store/${user.alias}`}
              target="_blank"
              className="btn bg-white text-cyan-700 hover:bg-cyan-50"
            >
              <ExternalLink size={20} />
              Visit Store
            </Link>
          </div>
        </div>
      )}

      {/* Recent Products */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Recent Products</h2>
          <Link href="/seller/products" className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="mx-auto text-zinc-300 mb-4" size={48} />
            <p className="text-zinc-600">No products yet</p>
            <Link href="/seller/products?action=new" className="text-cyan-600 hover:text-cyan-700 font-medium">
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {products.map((product) => (
              <div key={product._id} className="p-4 flex items-center space-x-4">
                <div className="w-16 h-16 bg-zinc-100 rounded-xl overflow-hidden flex-shrink-0">
                  {product.images[0] ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${product.images[0]}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <Package size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-medium text-zinc-900 truncate">{product.name}</h3>
                  <p className="text-sm text-zinc-600">₹{product.basePrice}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-zinc-500 hidden sm:block">
                  {formatDate(product.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

