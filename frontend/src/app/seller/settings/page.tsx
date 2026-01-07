'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi, uploadApi } from '@/lib/api';
import { themes, ThemeKey } from '@/lib/themes';
import toast from 'react-hot-toast';
import { Save, Upload, Check, Store, User, Palette, Search, Info, HelpCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessDescription: '',
    theme: 'minimal' as ThemeKey,
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
    seoMetaTitle: '',
    seoMetaDescription: '',
    seoKeywords: [] as string[],
    seoLocalArea: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        businessDescription: user.businessDescription || '',
        theme: (user.theme as ThemeKey) || 'minimal',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          pincode: user.address?.pincode || '',
        },
        seoMetaTitle: user.seoMetaTitle || '',
        seoMetaDescription: user.seoMetaDescription || '',
        seoKeywords: user.seoKeywords || [],
        seoLocalArea: user.seoLocalArea || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.updateProfile(formData);
      updateUser(response.data);
      toast.success('Settings saved');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadApi.uploadLogo(file);
      updateUser({ businessLogo: response.data.path });
      toast.success('Logo uploaded');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await uploadApi.uploadBanner(file);
      updateUser({ businessBanner: response.data.path });
      toast.success('Banner uploaded');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
        <p className="text-zinc-600">Manage your store settings and profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Store Branding */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Store className="text-cyan-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold">Store Branding</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Store Logo</label>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 bg-zinc-100 rounded-xl overflow-hidden flex items-center justify-center border-2 border-zinc-200 flex-shrink-0">
                  {user?.businessLogo ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${user.businessLogo}`}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Store className="text-zinc-300" size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <label className="btn btn-secondary cursor-pointer inline-block">
                    <Upload size={18} />
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-xs text-zinc-500 mt-2">
                    Recommended: 512×512px, Square, Max 2MB
                    <br />
                    <span className="text-zinc-400">Accepted: 256×256 to 2048×2048px</span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Store Banner</label>
              <div className="flex items-start gap-4">
                <div className="w-48 h-20 bg-zinc-100 rounded-xl overflow-hidden flex items-center justify-center border-2 border-zinc-200 flex-shrink-0">
                  {user?.businessBanner ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${user.businessBanner}`}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-zinc-400">1920×400</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="btn btn-secondary cursor-pointer inline-block">
                    <Upload size={18} />
                    {uploading ? 'Uploading...' : 'Upload Banner'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                      onChange={handleBannerUpload}
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-xs text-zinc-500 mt-2">
                    Recommended: 1920×400px, Landscape (4:1 ratio), Max 5MB
                    <br />
                    <span className="text-zinc-400">Accepted: 1200×250 to 3840×800px</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="form-label">Business Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Tell customers about your business..."
              value={formData.businessDescription}
              onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              maxLength={500}
            />
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Palette className="text-violet-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold">Store Theme</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(themes) as ThemeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormData({ ...formData, theme: key })}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  formData.theme === key
                    ? 'border-cyan-500 ring-2 ring-cyan-200'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div
                  className="h-12 rounded-lg mb-2"
                  style={{ background: themes[key].background }}
                />
                <span className="text-sm font-medium text-zinc-700">
                  {themes[key].name}
                </span>
                {formData.theme === key && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <User className="text-emerald-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Your Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <p className="text-xs text-zinc-500 mt-1">Orders will be sent to this WhatsApp</p>
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="Street address"
                value={formData.address.street}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
              />
            </div>

            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={formData.address.city}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
              />
            </div>

            <div>
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-input"
                value={formData.address.state}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
              />
            </div>

            <div>
              <label className="form-label">Pincode</label>
              <input
                type="text"
                className="form-input"
                value={formData.address.pincode}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
              />
            </div>
          </div>
        </div>

        {/* SEO Optimization Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Search size={20} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">SEO Optimization</h2>
              <p className="text-sm text-zinc-600 mt-1">
                Optimize your microsite for search engines to help customers find your products
              </p>
            </div>
            <div className="relative group">
              <HelpCircle size={20} className="text-zinc-400 cursor-help" />
              <div className="absolute right-0 top-8 w-80 p-4 bg-zinc-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <p className="mb-2 font-semibold">💡 SEO Tips:</p>
                <ul className="space-y-1 list-disc list-inside text-zinc-300">
                  <li>Include your business name and main product in meta title</li>
                  <li>Add your location (city/pincode) to appear in local searches</li>
                  <li>Use keywords customers would search for</li>
                  <li>Be specific and descriptive</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="text-purple-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-purple-900">
                <p className="font-semibold mb-1">How SEO Settings Work:</p>
                <p className="text-purple-800 mb-2">
                  These settings help your store appear in search results when customers search for products in your area. 
                  For example, if someone searches for "toys in Delhi" or "gift items near [your pincode]", your store can appear in the results.
                </p>
                <p className="text-purple-800">
                  <strong>Pro Tip:</strong> Always include your location (city, pincode, or local area name) and main product categories in your keywords. 
                  This helps local customers find you easily!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="form-label flex items-center gap-2">
                Meta Title
                <span className="text-xs text-zinc-400 font-normal">(Max 100 characters)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Handmade Toys & Gifts by [Your Business Name] - Delhi"
                value={formData.seoMetaTitle}
                onChange={(e) => setFormData({ ...formData, seoMetaTitle: e.target.value })}
                maxLength={100}
              />
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                <Info size={12} />
                A concise, keyword-rich title that appears in search results. Include your business name, main product type, and location.
              </p>
              <div className="mt-1 text-xs text-zinc-400">
                Character count: {formData.seoMetaTitle.length}/100
              </div>
            </div>

            <div>
              <label className="form-label flex items-center gap-2">
                Meta Description
                <span className="text-xs text-zinc-400 font-normal">(Max 300 characters)</span>
              </label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="e.g., Discover unique handmade toys, custom gifts, and home decor items from [Your Business Name] in Delhi. Best prices, bulk orders welcome, cash on delivery available."
                value={formData.seoMetaDescription}
                onChange={(e) => setFormData({ ...formData, seoMetaDescription: e.target.value })}
                maxLength={300}
              />
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                <Info size={12} />
                A brief summary of your store and products that appears in search results. Include keywords, your location, and what makes you special.
              </p>
              <div className="mt-1 text-xs text-zinc-400">
                Character count: {formData.seoMetaDescription.length}/300
              </div>
            </div>

            <div>
              <label className="form-label">Keywords (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., handmade toys, custom gifts, home decor, Delhi, [your pincode], wholesale, best rates, cash on delivery"
                value={formData.seoKeywords.join(', ')}
                onChange={(e) => {
                  const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k.length > 0);
                  setFormData({ ...formData, seoKeywords: keywords });
                }}
              />
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                <Info size={12} />
                List relevant keywords that customers might use to find your products. Include: product types, your city/pincode, local area names (e.g., "Sadar Bazar Delhi"), and services (wholesale, COD, etc.)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.seoKeywords.map((keyword, idx) => (
                  <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Local Area Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Sadar Bazar, Connaught Place, Karol Bagh, etc."
                value={formData.seoLocalArea}
                onChange={(e) => setFormData({ ...formData, seoLocalArea: e.target.value })}
              />
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                <Info size={12} />
                If you're located in a well-known area or market (like "Sadar Bazar Delhi"), add it here. This helps customers searching for that specific location find your store.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">📋 Example SEO Setup:</p>
              <div className="text-xs text-blue-800 space-y-2">
                <div>
                  <strong>Meta Title:</strong> "Wholesale Toys & Gifts - [Business Name] - Sadar Bazar Delhi"
                </div>
                <div>
                  <strong>Meta Description:</strong> "Best wholesale toys, gift items, and school supplies in Sadar Bazar Delhi. Cheapest rates, bulk orders, cash on delivery. Visit our store or order online!"
                </div>
                <div>
                  <strong>Keywords:</strong> "toys, gift items, school supplies, Sadar Bazar Delhi, wholesale, cheapest rate, bulk supply, cash on delivery, [your pincode]"
                </div>
                <div>
                  <strong>Local Area:</strong> "Sadar Bazar Delhi"
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full sm:w-auto"
        >
          <Save size={20} />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

