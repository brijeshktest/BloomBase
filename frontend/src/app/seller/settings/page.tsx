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
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-zinc-100 rounded-xl overflow-hidden flex items-center justify-center">
                  {user?.businessLogo ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${user.businessLogo}`}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="text-zinc-300" size={32} />
                  )}
                </div>
                <label className="btn btn-secondary cursor-pointer">
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="form-label">Store Banner</label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-20 bg-zinc-100 rounded-xl overflow-hidden flex items-center justify-center">
                  {user?.businessBanner ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${user.businessBanner}`}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-zinc-400">1200×400</span>
                  )}
                </div>
                <label className="btn btn-secondary cursor-pointer">
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                    disabled={uploading}
                  />
                </label>
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

