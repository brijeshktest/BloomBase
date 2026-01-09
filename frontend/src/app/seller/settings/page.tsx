'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi, uploadApi, merchantFeedApi } from '@/lib/api';
import { themes, ThemeKey } from '@/lib/themes';
import toast from 'react-hot-toast';
import { Save, Upload, Check, Store, User, Palette, Search, Info, HelpCircle, Video, X, ShoppingCart, Copy, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const hasFetchedProfile = useRef(false);
  const [feedInfo, setFeedInfo] = useState<{
    feedUrl?: string;
    statistics?: {
      totalProducts: number;
      productsWithStock: number;
      productsWithImages: number;
      productsInFeed: number;
    };
  } | null>(null);
  const [loadingFeedInfo, setLoadingFeedInfo] = useState(false);

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
    instagramHandle: '',
    facebookHandle: '',
    areaSpecialist: false,
  });

  // Fetch full user profile on mount to ensure all fields are loaded
  useEffect(() => {
    // Only fetch once when user is available
    if (hasFetchedProfile.current || !user) {
      if (!user) {
        // If user is not available yet, use existing data from store
        setLoadingProfile(false);
      }
      return;
    }

    const fetchUserProfile = async () => {
      hasFetchedProfile.current = true;
      setLoadingProfile(true);
      try {
        const response = await authApi.getMe();
        const fullUser = response.data;
        updateUser(fullUser);
        
        // Extract 10-digit number from phone (remove +91 prefix if present)
        let phoneNumber = fullUser.phone || '';
        if (phoneNumber.startsWith('+91')) {
          phoneNumber = phoneNumber.slice(3);
        } else if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
          phoneNumber = phoneNumber.slice(2);
        }
        
        setFormData({
          name: fullUser.name || '',
          phone: phoneNumber, // Store only 10 digits in form
          businessDescription: fullUser.businessDescription || '',
          theme: (fullUser.theme as ThemeKey) || 'minimal',
          address: {
            street: fullUser.address?.street || '',
            city: fullUser.address?.city || '',
            state: fullUser.address?.state || '',
            pincode: fullUser.address?.pincode || '',
          },
          seoMetaTitle: fullUser.seoMetaTitle || '',
          seoMetaDescription: fullUser.seoMetaDescription || '',
          seoKeywords: fullUser.seoKeywords || [],
          seoLocalArea: fullUser.seoLocalArea || '',
          instagramHandle: fullUser.instagramHandle || '',
          facebookHandle: fullUser.facebookHandle || '',
          areaSpecialist: fullUser.areaSpecialist || false,
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to user from store if API call fails
        if (user) {
          let phoneNumber = user.phone || '';
          if (phoneNumber.startsWith('+91')) {
            phoneNumber = phoneNumber.slice(3);
          } else if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
            phoneNumber = phoneNumber.slice(2);
          }
          
          setFormData({
            name: user.name || '',
            phone: phoneNumber,
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
            instagramHandle: user.instagramHandle || '',
            facebookHandle: user.facebookHandle || '',
            areaSpecialist: user.areaSpecialist || false,
          });
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]); // Only run when user ID changes (i.e., when user is first loaded)

  // Fetch feed info on mount
  useEffect(() => {
    const fetchFeedInfo = async () => {
      setLoadingFeedInfo(true);
      try {
        const response = await merchantFeedApi.getFeedInfo();
        setFeedInfo(response.data);
      } catch (error) {
        console.error('Error fetching feed info:', error);
      } finally {
        setLoadingFeedInfo(false);
      }
    };

    if (user) {
      fetchFeedInfo();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate address fields
      if (!formData.address.street || !formData.address.city || !formData.address.state || !formData.address.pincode) {
        toast.error('Please fill in all address fields (street, city, state, pincode)');
        setLoading(false);
        return;
      }

      // Ensure phone has +91 prefix
      const phoneWithCountryCode = formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`;
      
      // Prepare submit data - ensure all fields are included
      const submitData: Record<string, unknown> = {
        name: formData.name,
        phone: phoneWithCountryCode,
        businessDescription: formData.businessDescription,
        theme: formData.theme,
        address: formData.address,
        seoMetaTitle: formData.seoMetaTitle,
        seoMetaDescription: formData.seoMetaDescription,
        seoKeywords: formData.seoKeywords,
        seoLocalArea: formData.seoLocalArea,
        instagramHandle: formData.instagramHandle?.trim() || '',
        facebookHandle: formData.facebookHandle?.trim() || '',
        areaSpecialist: formData.areaSpecialist,
      };
      
      const response = await authApi.updateProfile(submitData);
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
      // Refresh full profile to ensure all fields are in sync
      const profileResponse = await authApi.getMe();
      updateUser(profileResponse.data);
      toast.success('Logo uploaded');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  // Helper function to generate initials from business name
  const getInitials = (name: string | undefined): string => {
    if (!name) return 'ST';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const handleSellerVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file must be less than 100MB');
      return;
    }

    // Validate file type
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!videoTypes.includes(file.type)) {
      toast.error('Only MP4, WebM, MOV, and AVI video files are allowed');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadApi.uploadSellerVideo(file);
      // Refresh full profile to ensure all fields are in sync
      const profileResponse = await authApi.getMe();
      updateUser(profileResponse.data);
      toast.success('Video uploaded successfully');
    } catch (error: any) {
      console.error('Seller video upload error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to upload video';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = async () => {
    try {
      setLoading(true);
      // Send empty string to backend to clear the video
      const response = await authApi.updateProfile({ sellerVideo: '' });
      updateUser(response.data);
      toast.success('Video removed');
    } catch (error: unknown) {
      console.error(error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to remove video');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="space-y-8 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
          <p className="text-zinc-600">Manage your store settings and profile</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-zinc-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-cyan-500">
                      <span className="text-2xl font-bold text-white">
                        {getInitials(user?.businessName || user?.name)}
                      </span>
                    </div>
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
          </div>

          {/* Seller Video */}
          <div className="mt-6">
            <label className="form-label">Meet the Seller Video</label>
            <p className="text-xs text-zinc-500 mb-3">
              Upload a video to share your story, vision, and connect with customers. This will be displayed in a "Meet the Seller" section on your store.
            </p>
            {user?.sellerVideo ? (
              <div className="space-y-3">
                <div className="relative w-full max-w-md">
                  <video
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${user.sellerVideo}`}
                    controls
                    className="w-full rounded-xl"
                  />
                  <button
                    onClick={handleRemoveVideo}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Remove video"
                  >
                    <X size={16} />
                  </button>
                </div>
                <label className="btn btn-secondary cursor-pointer inline-block">
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Replace Video'}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    className="hidden"
                    onChange={handleSellerVideoUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            ) : (
              <label className="btn btn-secondary cursor-pointer inline-block">
                <Video size={18} />
                {uploading ? 'Uploading...' : 'Upload Video'}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  className="hidden"
                  onChange={handleSellerVideoUpload}
                  disabled={uploading}
                />
              </label>
            )}
            <p className="text-xs text-zinc-500 mt-2">
              Accepted formats: MP4, WebM, MOV, AVI (Max 100MB)
              <br />
              <span className="text-zinc-400">Recommended: MP4 format for best compatibility</span>
            </p>
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
              <label className="form-label">Phone Number *</label>
              <div className="flex gap-2">
                <div className="flex items-center px-4 py-2 bg-zinc-100 border border-zinc-300 rounded-lg text-zinc-600 font-medium select-none">
                  +91
                </div>
                <input
                  type="tel"
                  className="form-input flex-1"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => {
                    // Only allow digits and limit to 10 digits
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: digits });
                  }}
                  maxLength={10}
                  required
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Orders will be sent to this WhatsApp number (+91{formData.phone || 'XXXXXXXXXX'})
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">Street Address *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Street address, building name, floor, etc."
                value={formData.address.street}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                required
              />
            </div>

            <div>
              <label className="form-label">City *</label>
              <input
                type="text"
                className="form-input"
                placeholder="City"
                value={formData.address.city}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                required
              />
            </div>

            <div>
              <label className="form-label">State *</label>
              <input
                type="text"
                className="form-input"
                placeholder="State"
                value={formData.address.state}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                required
              />
            </div>

            <div>
              <label className="form-label">Pincode *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Pincode"
                value={formData.address.pincode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setFormData({ ...formData, address: { ...formData.address, pincode: digits } });
                }}
                maxLength={6}
                required
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Social Media</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">Instagram Handle</label>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">@</span>
                <input
                  type="text"
                  className="form-input flex-1"
                  placeholder="your_instagram_handle"
                  value={formData.instagramHandle}
                  onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value.replace('@', '').replace(/\s/g, '') })}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Your Instagram handle (without @). This will be displayed on your store to encourage customers to follow you.
              </p>
            </div>

            <div>
              <label className="form-label">Facebook Handle</label>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">facebook.com/</span>
                <input
                  type="text"
                  className="form-input flex-1"
                  placeholder="your_facebook_page"
                  value={formData.facebookHandle}
                  onChange={(e) => setFormData({ ...formData, facebookHandle: e.target.value.replace('facebook.com/', '').replace(/\s/g, '') })}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Your Facebook page handle (without facebook.com/). This will be displayed on your store to encourage customers to follow you.
              </p>
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
                <p className="text-purple-800 mb-2">
                  <strong>✨ Auto-Generation:</strong> When you set your address (city, state) or local area, we automatically generate location-based SEO keywords 
                  like "home bakers near me", "handmade gifts in [City]", etc. You can customize these or leave them as-is for optimal local search visibility.
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

            {/* Area Specialist Toggle */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <label className="form-label mb-0 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.areaSpecialist}
                        onChange={(e) => setFormData({ ...formData, areaSpecialist: e.target.checked })}
                        className="w-5 h-5 text-purple-600 border-zinc-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-lg font-bold text-zinc-900">Area Specialist</span>
                    </label>
                  </div>
                  
                  <div className="bg-white rounded-lg p-5 border border-purple-200 mb-4">
                    <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      What is Area Specialist?
                    </h4>
                    <p className="text-sm text-zinc-700 mb-4">
                      Area Specialist is a powerful feature that helps local customers find your store when they search for products "near me" or in your area. When enabled, we add special location codes (called Schema markup) to your microsite that tell Google exactly where your business is located.
                    </p>
                    
                    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500 mb-4">
                      <p className="text-sm font-semibold text-purple-900 mb-2">💡 Real Example:</p>
                      <p className="text-xs text-purple-800 mb-2">
                        If you sell handmade jewelry in Delhi and a customer searches for <strong>"handmade jewelry near me"</strong> or <strong>"jewelry in Delhi"</strong>, your store will appear in their search results because Google knows exactly where you're located!
                      </p>
                    </div>

                    <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2 mt-4">
                      <span className="text-lg">✨</span>
                      How This Helps You:
                    </h4>
                    <ul className="text-sm text-zinc-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span><strong>More Local Customers:</strong> People searching for products in your area will find your store easily</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span><strong>Free Visibility:</strong> No need to pay for ads - Google shows your store for free in local searches</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span><strong>Competitive Advantage:</strong> Stand out from sellers who haven't enabled this feature</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span><strong>Better Rankings:</strong> Google prioritizes businesses with clear location information</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Info size={14} className="text-blue-600" />
                      How It Works Technically:
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                      <li>We add special Schema.org markup (LocalBusiness and PostalAddress) to your microsite</li>
                      <li>This markup tells Google your exact location (street, city, state, pincode)</li>
                      <li>When customers search "near me" or for products in your area, Google shows your store</li>
                      <li>Works automatically - no technical knowledge needed from you!</li>
                    </ul>
                  </div>

                  {formData.areaSpecialist && (!formData.address.city || !formData.address.state) && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800 flex items-start gap-2">
                        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Important:</strong> Please fill in your complete address (City and State at minimum) above for Area Specialist to work effectively. Without your address, Google won't know where to show your store in local searches.
                        </span>
                      </p>
                    </div>
                  )}

                  {formData.areaSpecialist && formData.address.city && formData.address.state && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 flex items-center gap-2">
                        <Check size={16} className="text-green-600" />
                        <span>
                          <strong>Great!</strong> Your address is complete. Area Specialist is active and helping customers find you in local searches.
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
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

        {/* Google Merchant Center Feed */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Google Merchant Center</h2>
              <p className="text-sm text-zinc-600 mt-1">
                Sync your products to Google Shopping for free visibility in search results
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">What is Google Merchant Center?</p>
                <p className="text-blue-800 mb-2">
                  Google Merchant Center allows your products to appear in Google Shopping results and search. 
                  When customers search for products like yours, your listings can show up with images, prices, and direct links to your store.
                </p>
                <p className="text-blue-800">
                  <strong>✨ Free & Automatic:</strong> We generate a product feed for you automatically. 
                  Just copy the feed URL below and add it to your Google Merchant Center account. 
                  Your products will sync daily!
                </p>
              </div>
            </div>
          </div>

          {loadingFeedInfo ? (
            <div className="text-center py-8 text-zinc-500">Loading feed information...</div>
          ) : feedInfo ? (
            <div className="space-y-6">
              <div>
                <label className="form-label">Your Product Feed URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    className="form-input flex-1 font-mono text-sm bg-zinc-50"
                    value={feedInfo.feedUrl || ''}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (feedInfo.feedUrl) {
                        await navigator.clipboard.writeText(feedInfo.feedUrl);
                        toast.success('Feed URL copied to clipboard!');
                      }
                    }}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                  <a
                    href={feedInfo.feedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    View Feed
                  </a>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  This URL contains all your active products in Google Merchant Center format. 
                  Copy this URL and add it to your Google Merchant Center account.
                </p>
              </div>

              {feedInfo.statistics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-zinc-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-zinc-900">{feedInfo.statistics.totalProducts}</div>
                    <div className="text-xs text-zinc-600 mt-1">Total Products</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-700">{feedInfo.statistics.productsWithStock}</div>
                    <div className="text-xs text-green-600 mt-1">In Stock</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-blue-700">{feedInfo.statistics.productsWithImages}</div>
                    <div className="text-xs text-blue-600 mt-1">With Images</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-purple-700">{feedInfo.statistics.productsInFeed}</div>
                    <div className="text-xs text-purple-600 mt-1">In Feed</div>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-900 mb-3">📋 How to Set Up Google Merchant Center:</p>
                <ol className="text-xs text-amber-800 space-y-2 list-decimal list-inside">
                  <li>Go to <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">merchants.google.com</a> and sign in with your Google account</li>
                  <li>Click on "Products" in the left menu, then select "Feeds"</li>
                  <li>Click the "+" button to add a new feed</li>
                  <li>Select "Scheduled fetch" as the feed type</li>
                  <li>Paste your feed URL (copied above) into the "File URL" field</li>
                  <li>Set the fetch frequency to "Daily" (recommended)</li>
                  <li>Click "Save" and wait for Google to process your feed (usually takes a few hours)</li>
                  <li>Once approved, your products will appear in Google Shopping results!</li>
                </ol>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-zinc-900 mb-2">⚠️ Important Requirements:</p>
                <ul className="text-xs text-zinc-700 space-y-1 list-disc list-inside">
                  <li>Products must have <strong>HTTP/HTTPS image URLs</strong> (not base64) to appear in the feed</li>
                  <li>Only products with <strong>stock &gt; 0</strong> are included</li>
                  <li>Only <strong>active products</strong> are included in the feed</li>
                  <li>The feed updates automatically when you add or modify products</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              Unable to load feed information. Please try again later.
            </div>
          )}
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

