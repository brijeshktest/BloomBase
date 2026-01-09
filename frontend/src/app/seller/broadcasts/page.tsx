'use client';

import { useState, useEffect } from 'react';
import { broadcastApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Edit, 
  Trash2, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail
} from 'lucide-react';

interface Broadcast {
  _id: string;
  title: string;
  message: string;
  type: 'new_arrival' | 'promotion' | 'announcement' | 'custom';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
  product?: {
    _id: string;
    name: string;
    slug: string;
  };
  promotion?: {
    _id: string;
    name: string;
  };
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null);
  const [sendingBroadcastId, setSendingBroadcastId] = useState<string | null>(null);
  const [subscriptionStats, setSubscriptionStats] = useState({ total: 0, subscribed: 0 });
  const [featureEnabled, setFeatureEnabled] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'new_arrival' as 'new_arrival' | 'promotion' | 'announcement' | 'custom',
    productId: '',
    promotionId: '',
    scheduledAt: ''
  });

  useEffect(() => {
    fetchBroadcasts();
    fetchSubscriptionStats();
    checkBroadcastsEnabled();
  }, []);

  const checkBroadcastsEnabled = async () => {
    try {
      await broadcastApi.getBroadcasts({ limit: 1 });
      setFeatureEnabled(true);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setFeatureEnabled(false);
        toast.error(error.response?.data?.message || 'Broadcasts feature is disabled');
      }
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const response = await broadcastApi.getBroadcasts();
      setBroadcasts(response.data.broadcasts);
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      toast.error('Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStats = async () => {
    try {
      const response = await broadcastApi.getSubscriptions({ limit: 1 });
      setSubscriptionStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const data: any = {
        title: formData.title,
        message: formData.message,
        type: formData.type
      };
      
      if (formData.productId) data.productId = formData.productId;
      if (formData.promotionId) data.promotionId = formData.promotionId;
      if (formData.scheduledAt) data.scheduledAt = formData.scheduledAt;
      
      if (editingBroadcast) {
        await broadcastApi.updateBroadcast(editingBroadcast._id, data);
        toast.success('Broadcast updated');
      } else {
        await broadcastApi.createBroadcast(data);
        toast.success('Broadcast created');
      }
      
      setShowCreateModal(false);
      setEditingBroadcast(null);
      resetForm();
      fetchBroadcasts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save broadcast');
    }
  };

  const handleSend = async (broadcastId: string) => {
    if (!confirm('Are you sure you want to send this broadcast to all subscribed customers?')) {
      return;
    }

    setSendingBroadcastId(broadcastId);
    try {
      const response = await broadcastApi.sendBroadcast(broadcastId);
      toast.success(`Broadcast sent to ${response.data.results.sent} recipients`);
      fetchBroadcasts();
      fetchSubscriptionStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSendingBroadcastId(null);
    }
  };

  const handleDelete = async (broadcastId: string) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) {
      return;
    }

    try {
      await broadcastApi.deleteBroadcast(broadcastId);
      toast.success('Broadcast deleted');
      fetchBroadcasts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete broadcast');
    }
  };

  const handleEdit = (broadcast: Broadcast) => {
    setEditingBroadcast(broadcast);
    setFormData({
      title: broadcast.title,
      message: broadcast.message,
      type: broadcast.type,
      productId: broadcast.product?._id || '',
      promotionId: broadcast.promotion?._id || '',
      scheduledAt: broadcast.scheduledAt ? new Date(broadcast.scheduledAt).toISOString().slice(0, 16) : ''
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'new_arrival',
      productId: '',
      promotionId: '',
      scheduledAt: ''
    });
    setEditingBroadcast(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'sending':
        return <Clock className="text-blue-500 animate-spin" size={16} />;
      case 'failed':
        return <XCircle className="text-red-500" size={16} />;
      case 'scheduled':
        return <Clock className="text-amber-500" size={16} />;
      default:
        return <AlertCircle className="text-zinc-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'sending':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'scheduled':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-600">Loading...</div>
      </div>
    );
  }

  if (!featureEnabled) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
          <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Broadcasts Feature Disabled</h2>
          <p className="text-zinc-600 mb-4">
            The WhatsApp broadcasts feature has been disabled for your account by the administrator.
          </p>
          <p className="text-sm text-zinc-500">
            Please contact the administrator if you need this feature enabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
              <MessageSquare className="text-cyan-600" size={32} />
              WhatsApp Broadcasts
            </h1>
            <p className="text-zinc-600 mt-2">
              Send "New Arrival" updates and announcements to your opted-in customers
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Create Broadcast
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Users className="text-cyan-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-600">Subscribed Customers</p>
                <p className="text-2xl font-bold text-zinc-900">{subscriptionStats.subscribed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Send className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-600">Total Broadcasts</p>
                <p className="text-2xl font-bold text-zinc-900">{broadcasts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Mail className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-600">Sent Broadcasts</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {broadcasts.filter(b => b.status === 'sent').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcasts List */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {broadcasts.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto text-zinc-300 mb-4" size={48} />
            <p className="text-zinc-600 mb-4">No broadcasts yet</p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors"
            >
              Create Your First Broadcast
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {broadcasts.map((broadcast) => (
              <div key={broadcast._id} className="p-6 hover:bg-zinc-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-zinc-900">{broadcast.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(broadcast.status)}`}>
                        {getStatusIcon(broadcast.status)}
                        {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-zinc-600 mb-3 line-clamp-2">{broadcast.message}</p>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span>Type: {broadcast.type.replace('_', ' ')}</span>
                      {broadcast.status === 'sent' && (
                        <>
                          <span>Sent: {broadcast.sentCount}/{broadcast.totalRecipients}</span>
                          {broadcast.failedCount > 0 && (
                            <span className="text-red-600">Failed: {broadcast.failedCount}</span>
                          )}
                        </>
                      )}
                      <span>Created: {new Date(broadcast.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {broadcast.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleEdit(broadcast)}
                          className="p-2 text-zinc-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleSend(broadcast._id)}
                          disabled={sendingBroadcastId === broadcast._id}
                          className="p-2 text-zinc-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Send"
                        >
                          <Send size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(broadcast._id)}
                          className="p-2 text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                    {broadcast.status === 'sent' && (
                      <div className="text-sm text-zinc-500">
                        Sent {broadcast.sentAt ? new Date(broadcast.sentAt).toLocaleDateString() : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200">
              <h2 className="text-2xl font-bold text-zinc-900">
                {editingBroadcast ? 'Edit Broadcast' : 'Create Broadcast'}
              </h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., New Arrival: Handmade Toys"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">
                  Message *
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Write your message here. It will be sent to all subscribed customers via WhatsApp."
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {formData.message.length}/1000 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-900 mb-2">
                  Type
                </label>
                <select
                  className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="new_arrival">New Arrival</option>
                  <option value="promotion">Promotion</option>
                  <option value="announcement">Announcement</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                <p className="text-sm text-cyan-900">
                  <strong>Note:</strong> This broadcast will be sent to all customers who have opted in to receive updates. 
                  Each message includes an opt-out link for compliance.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors"
                >
                  {editingBroadcast ? 'Update Broadcast' : 'Create Broadcast'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
