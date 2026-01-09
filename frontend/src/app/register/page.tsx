'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Store, ArrowLeft, Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { themes, ThemeKey } from '@/lib/themes';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    businessDescription: '',
    theme: 'minimal' as ThemeKey,
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  // Check if all required fields are filled
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.length >= 6 &&
      formData.phone.length === 10 &&
      formData.businessName.trim() !== '' &&
      formData.address.street.trim() !== '' &&
      formData.address.city.trim() !== '' &&
      formData.address.state.trim() !== '' &&
      formData.address.pincode.length === 6 &&
      acceptedTerms
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate terms acceptance
      if (!acceptedTerms) {
        toast.error('Please accept the Terms and Conditions to continue');
        setLoading(false);
        return;
      }

      // Validate address before submission
      if (!formData.address.street || !formData.address.city || !formData.address.state || !formData.address.pincode) {
        toast.error('Please fill in all address fields');
        setLoading(false);
        return;
      }
      
      // Ensure phone has +91 prefix
      const phoneWithCountryCode = formData.phone.startsWith('+91') ? formData.phone : `+91${formData.phone}`;
      
      await authApi.registerSeller({
        ...formData,
        phone: phoneWithCountryCode
      });
      toast.success('Registration successful! Please wait for admin approval.');
      router.push('/login');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-100 to-zinc-200">
      <Header />
      
      <main className="flex-grow py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-zinc-600 hover:text-zinc-900 mb-8 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900">Start Selling Online</h1>
              <p className="text-zinc-600 mt-2">Create your store in minutes</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Your Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number *</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-4 py-2 bg-zinc-100 border border-zinc-300 rounded-lg text-zinc-600 font-medium">
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
              </div>

              {/* Address Section */}
              <div className="border-t border-zinc-200 pt-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Business Address *</h3>
                <p className="text-sm text-zinc-600 mb-4">
                  Complete address is required for local SEO and customer discovery
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

              <div>
                <label className="form-label">Business Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="My Awesome Store"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">This will be your store URL: selllocalonline.com/store/{formData.businessName ? formData.businessName.toLowerCase().replace(/\s+/g, '-') : 'your-store'}</p>
              </div>

              <div>
                <label className="form-label">Business Description</label>
                <textarea
                  className="form-input min-h-[100px] resize-none"
                  placeholder="Tell customers about your business..."
                  value={formData.businessDescription}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pr-12"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Choose Your Theme</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
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

              <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
                <p className="text-sm text-cyan-800">
                  ✨ <strong>Free 1 Month Trial</strong> - No credit card required. 
                  Your account will be reviewed and approved within 24 hours.
                </p>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 text-cyan-600 border-zinc-300 rounded focus:ring-cyan-500 focus:ring-2 cursor-pointer"
                    required
                  />
                  <div className="flex-1">
                    <span className="text-sm text-zinc-900 font-medium">
                      I accept the{' '}
                      <span className="text-cyan-600 group-hover:text-cyan-700 underline">
                        Terms and Conditions
                      </span>
                    </span>
                    <div className="mt-2 text-xs text-zinc-700 leading-relaxed">
                      <p className="mb-2">
                        By registering, I agree to use SellLocal Online platform in compliance with all applicable laws and regulations. I understand that:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>I will not engage in any unsolicited activities, including but not limited to spam messaging, unauthorized marketing, or harassment of customers.</li>
                        <li>I will not use the platform to send unsolicited communications to customers who have not explicitly opted in to receive messages from me.</li>
                        <li>Any unsolicited activities conducted by me will be at my own risk and responsibility.</li>
                        <li>SellLocal Online reserves the right to suspend or terminate my account if I engage in unsolicited activities or violate platform policies.</li>
                        <li>I am solely responsible for all content I post, products I list, and communications I send through the platform.</li>
                      </ul>
                      <p className="mt-2 font-semibold text-zinc-900">
                        I acknowledge that engaging in unsolicited activities may result in account suspension, legal action, or other consequences, and I accept full responsibility for my actions.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className="w-full btn btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating your store...
                  </span>
                ) : (
                  'Create My Store'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-zinc-600">
                Already have an account?{' '}
                <Link href="/login" className="text-cyan-600 font-semibold hover:text-cyan-700">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

