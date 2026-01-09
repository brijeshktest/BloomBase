'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { adminApi, issueApi } from '@/lib/api';
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
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  Send,
  AlertTriangle,
  X,
  Bug,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';

interface SellerWithStats extends User {
  productCount?: number;
  activeProductCount?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, hasHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSellers: 0,
    pendingSellers: 0,
    activeSellers: 0,
    suspendedSellers: 0,
    totalBuyers: 0,
    totalProducts: 0,
    trialExpiringSoon: 0,
  });
  const [sellers, setSellers] = useState<SellerWithStats[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerWithStats | null>(null);
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [broadcastsEnabled, setBroadcastsEnabled] = useState(true);
  const [loadingBroadcastSetting, setLoadingBroadcastSetting] = useState(false);
  const [activeTab, setActiveTab] = useState<'sellers' | 'issues'>('sellers');
  const [issues, setIssues] = useState<any[]>([]);
  const [issueStats, setIssueStats] = useState({ total: 0, pending: 0, byStatus: {} as Record<string, number> });
  const [issueStatusFilter, setIssueStatusFilter] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [hasHydrated, isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      const [statsRes, sellersRes, broadcastsRes, issuesRes, issueStatsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getSellers({ limit: '100' }),
        adminApi.getBroadcastsEnabled().catch(() => ({ data: { enabled: true } })),
        issueApi.getAllIssues({ status: issueStatusFilter || undefined }).catch(() => ({ data: { issues: [] } })),
        issueApi.getIssueStats().catch(() => ({ data: { total: 0, pending: 0, byStatus: {} } })),
      ]);
      setStats(statsRes.data);
      setSellers(sellersRes.data.sellers);
      setBroadcastsEnabled(broadcastsRes.data.enabled);
      setIssues(issuesRes.data.issues || []);
      setIssueStats(issueStatsRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const response = await issueApi.getAllIssues({ status: issueStatusFilter || undefined });
      setIssues(response.data.issues || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load issues');
    }
  };

  const updateIssueStatus = async (issueId: string, status: string, adminNotes?: string) => {
    try {
      await issueApi.updateIssueStatus(issueId, { status, adminNotes });
      toast.success('Issue status updated');
      fetchIssues();
      fetchData(); // Refresh stats
      setShowIssueModal(false);
      setSelectedIssue(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update issue status');
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
      
      if (response.data.notificationUrl) {
        window.open(response.data.notificationUrl, '_blank');
      }
      
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to approve seller');
    }
  };

  const handleSendVerification = async (seller: SellerWithStats) => {
    try {
      const response = await adminApi.sendPhoneVerification(seller._id || seller.id);
      toast.success('Verification link generated. Send it on WhatsApp.');
      if (response.data.whatsappUrl) {
        window.open(response.data.whatsappUrl, '_blank');
      }
      fetchSellers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to generate verification link');
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

  const openExtensionModal = (seller: SellerWithStats) => {
    setSelectedSeller(seller);
    setExtensionMonths(1);
    setShowExtensionModal(true);
  };

  const handleExtendValidity = async () => {
    if (!selectedSeller || extensionMonths < 1) {
      toast.error('Please select valid number of months');
      return;
    }

    try {
      const response = await adminApi.extendValidity(selectedSeller._id || selectedSeller.id, extensionMonths);
      toast.success(`Account extended by ${extensionMonths} month${extensionMonths > 1 ? 's' : ''}`);
      
      if (response.data.notificationUrl) {
        window.open(response.data.notificationUrl, '_blank');
      }
      
      setShowExtensionModal(false);
      setSelectedSeller(null);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to extend validity');
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

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center text-zinc-600">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900 text-white py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="/logo-full.svg" 
                alt="SellLocal Online" 
                className="h-12 sm:h-14 w-auto"
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
        {/* Global Broadcast Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare size={20} className="text-cyan-600" />
                WhatsApp Broadcasts Feature
              </h2>
              <p className="text-sm text-zinc-600 mt-1">
                Control the broadcast feature globally. When disabled, all sellers cannot use broadcasts.
              </p>
            </div>
            <button
              onClick={async () => {
                setLoadingBroadcastSetting(true);
                try {
                  const newValue = !broadcastsEnabled;
                  console.log('Setting broadcasts enabled to:', newValue);
                  const response = await adminApi.setBroadcastsEnabled(newValue);
                  console.log('Response:', response.data);
                  setBroadcastsEnabled(newValue);
                  toast.success(response.data?.message || `Broadcasts ${newValue ? 'enabled' : 'disabled'} globally`);
                } catch (error: any) {
                  console.error('Error updating broadcast setting:', error);
                  console.error('Error response:', error.response?.data);
                  toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to update setting');
                } finally {
                  setLoadingBroadcastSetting(false);
                }
              }}
              disabled={loadingBroadcastSetting}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
                broadcastsEnabled
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              } disabled:opacity-50`}
            >
              {broadcastsEnabled ? (
                <>
                  <ToggleRight size={20} className="text-emerald-600" />
                  Enabled
                </>
              ) : (
                <>
                  <ToggleLeft size={20} className="text-zinc-400" />
                  Disabled
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {[
            { label: 'Total Sellers', value: stats.totalSellers, icon: Users, color: 'bg-cyan-500' },
            { label: 'Pending', value: stats.pendingSellers, icon: Clock, color: 'bg-amber-500' },
            { label: 'Active', value: stats.activeSellers, icon: CheckCircle, color: 'bg-emerald-500' },
            { label: 'Suspended', value: stats.suspendedSellers, icon: AlertTriangle, color: 'bg-red-500' },
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

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('sellers')}
              className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors ${
                activeTab === 'sellers'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users size={18} />
                Sellers
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('issues');
                fetchIssues();
              }}
              className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors relative ${
                activeTab === 'issues'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Bug size={18} />
                Issue Reports
                {issueStats.pending > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {issueStats.pending}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Issue Reports Tab */}
        {activeTab === 'issues' && (
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100">
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Bug size={20} className="text-red-600" />
                  Issue Reports
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600">Total:</span>
                    <span className="font-bold text-zinc-900">{issueStats.total}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">Pending:</span>
                    <span className="font-bold text-amber-600">{issueStats.pending}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Filters */}
            <div className="p-4 border-b border-zinc-100">
              <select
                value={issueStatusFilter}
                onChange={(e) => {
                  setIssueStatusFilter(e.target.value);
                  fetchIssues();
                }}
                className="form-input max-w-xs"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Issues List */}
            <div className="divide-y divide-zinc-100">
              {issues.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">No issues reported</div>
              ) : (
                issues.map((issue) => (
                  <div
                    key={issue._id || issue.id}
                    className="p-6 hover:bg-zinc-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedIssue(issue);
                      setShowIssueModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-zinc-900">{issue.title}</h3>
                          <span className={`badge ${
                            issue.status === 'pending' ? 'badge-warning' :
                            issue.status === 'in_progress' ? 'badge-info' :
                            issue.status === 'resolved' ? 'badge-success' :
                            'badge-danger'
                          }`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                          <span className="badge badge-info">{issue.issueType}</span>
                        </div>
                        <p className="text-sm text-zinc-600 mb-2 line-clamp-2">{issue.description}</p>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>By: {issue.reporterName} ({issue.reporterRole})</span>
                          <span>•</span>
                          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <a
                            href={issue.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={12} />
                            View Page
                          </a>
                        </div>
                      </div>
                      {issue.screenshot && (
                        <div className="w-24 h-24 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-100 flex-shrink-0">
                          <img
                            src={issue.screenshot}
                            alt="Screenshot"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Sellers Tab */}
        {activeTab === 'sellers' && (
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
              <option value="suspended">Suspended</option>
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
                    <th className="text-left px-6 py-3 font-medium hidden xl:table-cell">Broadcasts</th>
                    <th className="text-right px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {sellers.map((seller) => {
                    const isSuspended = seller.isSuspended || false;
                    return (
                      <tr 
                        key={seller._id || seller.id} 
                        className={`hover:bg-zinc-50 ${isSuspended ? 'bg-red-50/50 border-l-4 border-red-500' : ''}`}
                      >
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
                            {isSuspended ? (
                              <span className="badge badge-danger">Suspended</span>
                            ) : !seller.isApproved ? (
                              <span className="badge badge-warning">Pending</span>
                            ) : seller.isActive ? (
                              <span className="badge badge-success">Active</span>
                            ) : (
                              <span className="badge badge-danger">Inactive</span>
                            )}
                            <span className={`badge ${seller.phoneVerified ? 'badge-success' : 'badge-warning'}`}>
                              <span className="inline-flex items-center gap-1">
                                <ShieldCheck size={12} />
                                {seller.phoneVerified ? 'Phone verified' : 'Phone not verified'}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden xl:table-cell">
                          {broadcastsEnabled ? (
                            <button
                              onClick={async () => {
                                try {
                                  const newValue = !(seller.broadcastsEnabled !== false);
                                  await adminApi.setSellerBroadcastsEnabled(seller._id || seller.id || '', newValue);
                                  setSellers(sellers.map(s => 
                                    s._id === seller._id || s.id === seller.id 
                                      ? { ...s, broadcastsEnabled: newValue }
                                      : s
                                  ));
                                  toast.success(`Broadcasts ${newValue ? 'enabled' : 'disabled'} for ${seller.businessName}`);
                                } catch (error: any) {
                                  toast.error(error.response?.data?.message || 'Failed to update setting');
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                seller.broadcastsEnabled !== false
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                              }`}
                              title={seller.broadcastsEnabled !== false ? 'Disable broadcasts' : 'Enable broadcasts'}
                            >
                              {seller.broadcastsEnabled !== false ? (
                                <>
                                  <ToggleRight size={16} className="text-emerald-600" />
                                  Enabled
                                </>
                              ) : (
                                <>
                                  <ToggleLeft size={16} className="text-zinc-400" />
                                  Disabled
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-sm text-zinc-400">Disabled globally</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Show verification button for all sellers with unverified phone */}
                            {!seller.phoneVerified && (
                              <button
                                onClick={() => handleSendVerification(seller)}
                                className="p-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200"
                                title="Send WhatsApp verification link"
                              >
                                <Send size={18} />
                              </button>
                            )}
                            
                            {!seller.isApproved && (
                              <button
                                onClick={() => handleApprove(seller)}
                                disabled={!seller.phoneVerified}
                                className={`p-2 rounded-lg ${
                                  seller.phoneVerified
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                }`}
                                title={seller.phoneVerified ? 'Approve' : 'Requires phone verification'}
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            {seller.isApproved && (
                              <>
                                {isSuspended ? (
                                  <button
                                    onClick={() => openExtensionModal(seller)}
                                    className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                                    title="Extend Validity"
                                  >
                                    <Calendar size={18} />
                                  </button>
                                ) : (
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
                                      onClick={() => openExtensionModal(seller)}
                                      className="p-2 rounded-lg hover:bg-zinc-100"
                                      title="Extend Validity"
                                    >
                                      <Calendar size={18} className="text-zinc-600" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Extension Modal */}
      {showExtensionModal && selectedSeller && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Extend Seller Validity</h2>
              <button
                onClick={() => {
                  setShowExtensionModal(false);
                  setSelectedSeller(null);
                }}
                className="p-2 hover:bg-zinc-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Seller</p>
                <p className="font-semibold">{selectedSeller.name}</p>
                <p className="text-sm text-zinc-500">{selectedSeller.businessName}</p>
              </div>

              <div>
                <p className="text-sm text-zinc-600 mb-1">Current Trial End Date</p>
                <p className="font-medium">{formatDate(selectedSeller.trialEndsAt)}</p>
              </div>

              <div>
                <label className="form-label">Extend by (Months)</label>
                <select
                  className="form-input"
                  value={extensionMonths}
                  onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
                >
                  {[1, 2, 3, 6, 12].map((months) => (
                    <option key={months} value={months}>
                      {months} {months === 1 ? 'Month' : 'Months'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSeller.isSuspended && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> This seller's account is currently suspended. Extending validity will automatically reactivate the account.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-100 flex gap-4">
              <button
                onClick={() => {
                  setShowExtensionModal(false);
                  setSelectedSeller(null);
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendValidity}
                className="flex-1 btn btn-primary"
              >
                Extend Validity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
