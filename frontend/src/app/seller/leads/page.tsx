'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import { User, Phone, Clock, Calendar, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface Visitor {
  _id: string;
  visitorName: string;
  visitorPhone: string;
  sessionId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: {
    registrationTime?: string;
    page?: string;
  };
}

export default function LeadsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [period]);

  useEffect(() => {
    // Filter visitors based on search term
    if (!searchTerm.trim()) {
      setFilteredVisitors(visitors);
    } else {
      const filtered = visitors.filter(
        (v) =>
          v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.visitorPhone.includes(searchTerm)
      );
      setFilteredVisitors(filtered);
    }
  }, [searchTerm, visitors]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getVisitors(period, 500);
      setVisitors(response.data.visitors || []);
      setFilteredVisitors(response.data.visitors || []);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast.error(error.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Registration Date', 'Time Ago', 'Page'];
    const rows = filteredVisitors.map((v) => [
      v.visitorName,
      v.visitorPhone,
      formatDate(v.timestamp),
      getTimeAgo(v.timestamp),
      v.metadata?.page || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads-${period}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const periodOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Leads</h1>
          <p className="text-sm text-zinc-600 mt-1">
            Visitor registrations and contact information
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {filteredVisitors.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600">Total Leads</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">
                {filteredVisitors.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
              <User className="text-cyan-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600">Unique Visitors</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">
                {new Set(filteredVisitors.map((v) => v.visitorPhone)).size}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Phone className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600">Today</p>
              <p className="text-2xl font-bold text-zinc-900 mt-1">
                {
                  filteredVisitors.filter((v) => {
                    const date = new Date(v.timestamp);
                    const today = new Date();
                    return (
                      date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Calendar className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading leads...</div>
        ) : filteredVisitors.length === 0 ? (
          <div className="p-12 text-center">
            <User className="mx-auto text-zinc-300 mb-4" size={48} />
            <p className="text-zinc-600">No leads found for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Time Ago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-zinc-200">
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor._id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center mr-3">
                          <User className="text-cyan-600" size={18} />
                        </div>
                        <span className="text-sm font-medium text-zinc-900">
                          {visitor.visitorName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://wa.me/${visitor.visitorPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
                      >
                        <Phone size={16} />
                        {visitor.visitorPhone}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <Clock size={16} />
                        {formatDate(visitor.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-zinc-500">{getTimeAgo(visitor.timestamp)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-zinc-600">
                        {visitor.metadata?.page || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://wa.me/${visitor.visitorPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors text-sm font-medium"
                      >
                        Contact on WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
