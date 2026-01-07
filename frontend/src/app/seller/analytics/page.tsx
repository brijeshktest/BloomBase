'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import { BarChart3, TrendingUp, Eye, ShoppingCart, CheckCircle, AlertCircle, Package, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface AnalyticsOverview {
  totalPageViews: number;
  uniqueVisitors: number;
  productViews: number;
  addToCartEvents: number;
  checkoutInitiated: number;
  checkoutCompleted: number;
  cartToCheckoutRate: number;
  checkoutConversionRate: number;
  cartAbandonmentRate: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  views: number;
  uniqueViews: number;
}

interface DailyActivity {
  _id: string;
  pageViews: number;
  productViews: number;
  addToCart: number;
  checkouts: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<Array<{ _id: number; count: number }>>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getOverview(period);
      setOverview(response.data.overview);
      setTopProducts(response.data.topProducts || []);
      setDailyActivity(response.data.dailyActivity || []);
      setHourlyActivity(response.data.hourlyActivity || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 7 Days';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Loading analytics...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-zinc-100">
        <BarChart3 className="mx-auto text-zinc-300 mb-4" size={64} />
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">No Analytics Data Yet</h3>
        <p className="text-zinc-600">Analytics will appear here once customers start visiting your store.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Analytics Dashboard</h1>
          <p className="text-zinc-600 mt-1">Track buyer interactions and optimize your store</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 mb-1">{overview.totalPageViews.toLocaleString()}</h3>
          <p className="text-sm text-zinc-600">Total Page Views</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 mb-1">{overview.uniqueVisitors.toLocaleString()}</h3>
          <p className="text-sm text-zinc-600">Unique Visitors</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 mb-1">{overview.productViews.toLocaleString()}</h3>
          <p className="text-sm text-zinc-600">Product Views</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 mb-1">{overview.addToCartEvents.toLocaleString()}</h3>
          <p className="text-sm text-zinc-600">Add to Cart</p>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8" />
            <h3 className="text-lg font-bold">Cart Conversion</h3>
          </div>
          <div className="text-4xl font-black mb-2">{overview.cartToCheckoutRate}%</div>
          <p className="text-cyan-100 text-sm">
            {overview.productViews > 0 
              ? `${overview.addToCartEvents} out of ${overview.productViews} product views`
              : 'No data yet'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8" />
            <h3 className="text-lg font-bold">Checkout Rate</h3>
          </div>
          <div className="text-4xl font-black mb-2">{overview.checkoutConversionRate}%</div>
          <p className="text-emerald-100 text-sm">
            {overview.addToCartEvents > 0
              ? `${overview.checkoutInitiated} out of ${overview.addToCartEvents} cart additions`
              : 'No data yet'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h3 className="text-lg font-bold">Cart Abandonment</h3>
          </div>
          <div className="text-4xl font-black mb-2">{overview.cartAbandonmentRate}%</div>
          <p className="text-orange-100 text-sm">
            {overview.addToCartEvents > 0
              ? `${overview.addToCartEvents - overview.checkoutInitiated} abandoned carts`
              : 'No data yet'}
          </p>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">Most Viewed Products</h2>
        {topProducts.length > 0 ? (
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{product.productName}</h3>
                    <p className="text-sm text-zinc-600">{product.uniqueViews} unique views</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-zinc-900">{product.views}</div>
                  <div className="text-xs text-zinc-500">total views</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-center py-8">No product views yet</p>
        )}
      </div>

      {/* Daily Activity Chart */}
      {dailyActivity.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Daily Activity Trend</h2>
          <div className="space-y-3">
            {dailyActivity.slice(-7).map((day) => {
              const maxValue = Math.max(day.pageViews, day.productViews, day.addToCart, day.checkouts);
              return (
                <div key={day._id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-700">
                      {new Date(day._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-zinc-500">
                      {day.pageViews} views • {day.checkouts} checkouts
                    </span>
                  </div>
                  <div className="flex gap-2 h-8">
                    <div
                      className="bg-blue-500 rounded"
                      style={{ width: `${maxValue > 0 ? (day.pageViews / maxValue) * 100 : 0}%` }}
                      title={`${day.pageViews} page views`}
                    />
                    <div
                      className="bg-purple-500 rounded"
                      style={{ width: `${maxValue > 0 ? (day.productViews / maxValue) * 100 : 0}%` }}
                      title={`${day.productViews} product views`}
                    />
                    <div
                      className="bg-amber-500 rounded"
                      style={{ width: `${maxValue > 0 ? (day.addToCart / maxValue) * 100 : 0}%` }}
                      title={`${day.addToCart} add to cart`}
                    />
                    <div
                      className="bg-emerald-500 rounded"
                      style={{ width: `${maxValue > 0 ? (day.checkouts / maxValue) * 100 : 0}%` }}
                      title={`${day.checkouts} checkouts`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hourly Activity */}
      {hourlyActivity.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Peak Activity Hours</h2>
          <div className="flex items-end gap-2 h-48">
            {hourlyActivity.map((hour) => {
              const maxCount = Math.max(...hourlyActivity.map(h => h.count));
              return (
                <div key={hour._id} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-500 to-teal-500 rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${maxCount > 0 ? (hour.count / maxCount) * 100 : 0}%` }}
                    title={`${hour.count} events at ${hour._id}:00`}
                  />
                  <span className="text-xs text-zinc-600">{hour._id}:00</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actionable Insights */}
      <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl border border-cyan-200 p-6">
        <h2 className="text-xl font-bold text-zinc-900 mb-4">💡 Actionable Insights</h2>
        <div className="space-y-3">
          {overview.cartAbandonmentRate > 50 && (
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <p className="font-semibold text-amber-900 mb-1">High Cart Abandonment</p>
              <p className="text-sm text-amber-800">
                Your cart abandonment rate is {overview.cartAbandonmentRate}%. Consider sending reminders or offering discounts to encourage checkout.
              </p>
            </div>
          )}
          {overview.productViews > 0 && overview.addToCartEvents / overview.productViews < 0.1 && (
            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <p className="font-semibold text-blue-900 mb-1">Low Conversion Rate</p>
              <p className="text-sm text-blue-800">
                Only {((overview.addToCartEvents / overview.productViews) * 100).toFixed(1)}% of product views result in add to cart. Consider optimizing product descriptions, images, and pricing.
              </p>
            </div>
          )}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <p className="font-semibold text-emerald-900 mb-1">Top Performing Product</p>
              <p className="text-sm text-emerald-800">
                "{topProducts[0].productName}" has {topProducts[0].views} views. Consider featuring similar products or creating promotions for less-viewed items.
              </p>
            </div>
          )}
          {overview.uniqueVisitors > 0 && overview.checkoutInitiated === 0 && (
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <p className="font-semibold text-purple-900 mb-1">No Checkouts Yet</p>
              <p className="text-sm text-purple-800">
                You have {overview.uniqueVisitors} visitors but no checkouts. Consider running promotions, improving product descriptions, or checking WhatsApp integration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
