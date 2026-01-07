'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Users,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Search,
  ExternalLink,
  LogOut,
  Calendar,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

interface SellerWithStats extends User {
  productCount?: number;
  activeProductCount?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSellers: 0,
    pendingSellers: 0,
    activeSellers: 0,
    totalBuyers: 0,
    totalProducts: 0,
    trialExpiringSoon: 0,
  });
  const [sellers, setSellers] = useState<SellerWithStats[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      const [statsRes, sellersRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getSellers({ limit: '100' }),
      ]);
      setStats(statsRes.data);
      setSellers(sellersRes.data.sellers);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const response = await adminApi.getSellers(params);
      setSellers(response.data.sellers);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSellers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleApprove = async (seller: SellerWithStats) => {
    try {
      const response = await adminApi.approveSeller(seller._id || seller.id);
      toast.success('Seller approved');
      
      // Open WhatsApp notification in new tab
      if (response.data.notificationUrl) {
        window.open(response.data.notificationUrl, '_blank');
      }
      
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to approve seller');
    }
  };

  const handleToggle = async (seller: SellerWithStats) => {
    try {
      await adminApi.toggleSeller(seller._id || seller.id);
      toast.success(`Seller ${seller.isActive ? 'deactivated' : 'activated'}`);
      fetchSellers();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update seller');
    }
  };

  const handleExtendTrial = async (seller: SellerWithStats) => {
    const days = prompt('Extend trial by how many days?', '30');
    if (!days) return;

    try {
      await adminApi.extendTrial(seller._id || seller.id, parseInt(days));
      toast.success(`Trial extended by ${days} days`);
      fetchSellers();
    } catch (error) {
      console.error(error);
      toast.error('Failed to extend trial');
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900 text-white py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="/logo-full.svg" 
                alt="BloomBase" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold hidden sm:inline text-white">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">Welcome, {user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Sellers', value: stats.totalSellers, icon: Users, color: 'bg-cyan-500' },
            { label: 'Pending', value: stats.pendingSellers, icon: Clock, color: 'bg-amber-500' },
            { label: 'Active', value: stats.activeSellers, icon: CheckCircle, color: 'bg-emerald-500' },
            { label: 'Total Buyers', value: stats.totalBuyers, icon: Users, color: 'bg-violet-500' },
            { label: 'Products', value: stats.totalProducts, icon: Package, color: 'bg-rose-500' },
            { label: 'Trials Ending', value: stats.trialExpiringSoon, icon: Calendar, color: 'bg-orange-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="text-white" size={20} />
              </div>
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              <p className="text-sm text-zinc-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Sellers */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100">
          <div className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LayoutDashboard size={20} />
              Manage Sellers
            </h2>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search sellers..."
                className="form-input pl-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-input sm:w-48"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sellers List */}
          {loading ? (
            <div className="p-12 text-center text-zinc-500">Loading...</div>
          ) : sellers.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">No sellers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 text-zinc-600 text-sm">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Seller</th>
                    <th className="text-left px-6 py-3 font-medium">Business</th>
                    <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Products</th>
                    <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Trial Ends</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-right px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {sellers.map((seller) => (
                    <tr key={seller._id || seller.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-zinc-900">{seller.name}</p>
                          <p className="text-sm text-zinc-500">{seller.email}</p>
                          <a
                            href={`https://wa.me/${seller.phone?.replace(/\+/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <MessageCircle size={14} />
                            {seller.phone}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-zinc-900">{seller.businessName}</p>
                          {seller.alias && (
                            <Link
                              href={`/store/${seller.alias}`}
                              target="_blank"
                              className="text-sm text-cyan-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink size={14} />
                              {seller.alias}
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-zinc-900">{seller.activeProductCount || 0}</span>
                        <span className="text-zinc-400"> / {seller.productCount || 0}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-sm text-zinc-600">
                        {formatDate(seller.trialEndsAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {!seller.isApproved ? (
                            <span className="badge badge-warning">Pending</span>
                          ) : seller.isActive ? (
                            <span className="badge badge-success">Active</span>
                          ) : (
                            <span className="badge badge-danger">Inactive</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {!seller.isApproved && (
                            <button
                              onClick={() => handleApprove(seller)}
                              className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          {seller.isApproved && (
                            <>
                              <button
                                onClick={() => handleToggle(seller)}
                                className="p-2 rounded-lg hover:bg-zinc-100"
                                title={seller.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {seller.isActive ? (
                                  <ToggleRight size={22} className="text-emerald-600" />
                                ) : (
                                  <ToggleLeft size={22} className="text-zinc-400" />
                                )}
                              </button>
                              <button
                                onClick={() => handleExtendTrial(seller)}
                                className="p-2 rounded-lg hover:bg-zinc-100"
                                title="Extend Trial"
                              >
                                <Calendar size={18} className="text-zinc-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

