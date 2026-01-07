'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { productApi, cartApi, authApi, availabilityApi } from '@/lib/api';
import { Product, Store as StoreType } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { getTheme, ThemeKey } from '@/lib/themes';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Package,
  Play,
  X,
  User,
  AlertCircle,
  Bell
} from 'lucide-react';

function ProductContent({ alias, slug }: { alias: string; slug: string }) {
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { items, setCart } = useCartStore();
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<StoreType | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '+91',
  });

  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters except +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +91
    if (!cleaned.startsWith('+91')) {
      if (cleaned.startsWith('91')) {
        cleaned = '+91' + cleaned.slice(2);
      } else if (cleaned.startsWith('+')) {
        cleaned = '+91' + cleaned.slice(1);
      } else {
        cleaned = '+91' + cleaned;
      }
    }
    
    // Limit to +91 followed by max 10 digits
    const digits = cleaned.slice(3);
    if (digits.length <= 10) {
      setAuthForm({ ...authForm, phone: cleaned });
    }
  };
  const [showCart, setShowCart] = useState(false);

  const theme = store ? getTheme((store.theme as ThemeKey) || 'minimal') : getTheme('minimal');

  useEffect(() => {
    fetchProduct();
  }, [alias, slug]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'buyer') {
      fetchCart();
    }
  }, [isAuthenticated, alias]);

  const fetchProduct = async () => {
    try {
      const response = await productApi.getStoreProduct(alias, slug);
      setProduct(response.data.product);
      setStore(response.data.store);
      setQuantity(response.data.product.minimumOrderQuantity || 1);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await cartApi.get(alias);
      setCart(response.data.items, response.data.total, alias);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const response = await authApi.login({
          email: authForm.email,
          password: authForm.password,
        });
        setAuth(response.data.user, response.data.token);
        toast.success('Welcome back!');
      } else {
        // Ensure phone has +91 prefix
        const phoneWithPrefix = authForm.phone.startsWith('+91') 
          ? authForm.phone 
          : '+91' + authForm.phone.replace(/\D/g, '');
        
        const response = await authApi.registerBuyer({
          ...authForm,
          phone: phoneWithPrefix,
          sellerAlias: alias,
        });
        setAuth(response.data.user, response.data.token);
        toast.success('Account created!');
      }
      setShowAuth(false);
      fetchCart();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    if (!product) return;

    // Check if product is out of stock
    if ((product.stock || 0) === 0) {
      toast.error('This product is currently out of stock');
      return;
    }

    try {
      await cartApi.add({
        productId: product._id,
        quantity,
        sellerAlias: alias,
      });
      toast.success('Added to cart');
      fetchCart();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleRequestAvailability = async () => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    if (!product) return;

    try {
      await availabilityApi.requestAvailability({
        productId: product._id,
        sellerAlias: alias,
      });
      toast.success('Request sent to seller! They will be notified.');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleUpdateCart = async (productId: string, qty: number) => {
    try {
      if (qty <= 0) {
        await cartApi.remove(alias, productId);
      } else {
        await cartApi.update({ productId, quantity: qty, sellerAlias: alias });
      }
      fetchCart();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update cart');
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await cartApi.checkout(alias);
      window.open(response.data.whatsappUrl, '_blank');
      setCart([], 0, alias);
      setShowCart(false);
      toast.success('Order sent to WhatsApp!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Checkout failed');
    }
  };

  const getCurrentPrice = () => {
    if (!product) return 0;
    
    if (product.priceTiers && product.priceTiers.length > 0) {
      const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
      for (const tier of sortedTiers) {
        if (quantity >= tier.minQuantity) {
          if (!tier.maxQuantity || quantity <= tier.maxQuantity) {
            return tier.price;
          }
        }
      }
    }
    
    return product.basePrice;
  };

  const getDisplayPrice = () => {
    const basePrice = getCurrentPrice();
    if (product?.hasPromotion && product.promotion) {
      if (product.promotion.discountType === 'percentage') {
        return basePrice - (basePrice * product.promotion.discountValue / 100);
      }
      return Math.max(0, basePrice - product.promotion.discountValue);
    }
    return basePrice;
  };

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + item.lineTotal, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.background }}>
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Product Not Found</h1>
          <Link href={`/store/${alias}`} className="text-cyan-600 hover:underline">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const displayPrice = getDisplayPrice();
  const originalPrice = getCurrentPrice();

  return (
    <div className="min-h-screen" style={{ background: theme.background }}>
      {/* Header */}
      <header style={{ backgroundColor: theme.headerBg }} className="text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/store/${alias}`}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">{store.businessName}</span>
            </Link>

            <div className="flex items-center gap-3">
              {isAuthenticated && user?.role === 'buyer' ? (
                <button
                  onClick={() => logout()}
                  className="text-sm opacity-80 hover:opacity-100"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30"
                >
                  <User size={18} />
                </button>
              )}
              
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 rounded-lg bg-white/20 hover:bg-white/30"
              >
                <ShoppingCart size={22} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-xs font-bold rounded-full flex items-center justify-center"
                    style={{ color: theme.primary }}
                  >
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-lg mb-4">
              {product.images[selectedImage] ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${product.images[selectedImage]}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="opacity-20" size={96} />
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedImage === idx ? 'border-current opacity-100' : 'border-transparent opacity-60'
                    }`}
                    style={{ borderColor: selectedImage === idx ? theme.primary : 'transparent' }}
                  >
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${img}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Video */}
            {product.video && (
              <div className="mt-4">
                {product.video.type === 'link' ? (
                  <a
                    href={product.video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow"
                    style={{ color: theme.primary }}
                  >
                    <Play size={20} />
                    Watch Product Video
                  </a>
                ) : (
                  <video
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${product.video.url}`}
                    controls
                    className="w-full rounded-xl"
                  />
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 h-fit">
            {product.hasPromotion && (
              <span
                className="inline-block px-3 py-1 text-sm font-bold text-white rounded-full mb-4"
                style={{ backgroundColor: theme.primary }}
              >
                {product.promotion?.discountType === 'percentage'
                  ? `${product.promotion.discountValue}% OFF`
                  : `₹${product.promotion?.discountValue} OFF`}
              </span>
            )}

            <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: theme.textPrimary }}>
              {product.name}
            </h1>
            
            <p className="text-sm mt-2" style={{ color: theme.textSecondary }}>
              {product.category}
            </p>

            <div className="mt-6">
              {product.hasPromotion ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold" style={{ color: theme.primary }}>
                    ₹{displayPrice.toFixed(2)}
                  </span>
                  <span className="text-xl line-through opacity-50">
                    ₹{originalPrice.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold" style={{ color: theme.primary }}>
                  ₹{displayPrice.toFixed(2)}
                </span>
              )}
              <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                per {product.unit}
              </p>
            </div>

            {/* Price Tiers */}
            {product.priceTiers && product.priceTiers.length > 0 && (
              <div className="mt-6 p-4 bg-zinc-50 rounded-xl">
                <h3 className="font-semibold mb-3" style={{ color: theme.textPrimary }}>
                  Volume Pricing
                </h3>
                <div className="space-y-2 text-sm">
                  {product.priceTiers
                    .sort((a, b) => a.minQuantity - b.minQuantity)
                    .map((tier, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span style={{ color: theme.textSecondary }}>
                          {tier.minQuantity}+ {product.unit}s
                        </span>
                        <span className="font-semibold" style={{ color: theme.primary }}>
                          ₹{tier.price.toFixed(2)} each
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {(product.stock || 0) > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2" style={{ color: theme.textPrimary }}>
                  Quantity (Min: {product.minimumOrderQuantity})
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(product.minimumOrderQuantity, quantity - 1))}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-100 hover:bg-zinc-200"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    min={product.minimumOrderQuantity}
                    max={product.stock || undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(product.minimumOrderQuantity, Math.min(product.stock || Infinity, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center text-lg font-semibold border rounded-xl py-2"
                  />
                  <button
                    onClick={() => setQuantity(Math.min((product.stock || Infinity), quantity + 1))}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-100 hover:bg-zinc-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {product.stock && (
                  <p className="text-xs mt-2 opacity-60" style={{ color: theme.textSecondary }}>
                    Available: {product.stock} {product.unit}
                  </p>
                )}
              </div>
            )}

            {/* Stock Status */}
            {(product.stock || 0) === 0 ? (
              <div className="mt-6 p-4 rounded-xl border-2 border-red-200 bg-red-50">
                <div className="flex items-center gap-2 text-red-600 mb-3">
                  <AlertCircle size={20} />
                  <span className="font-semibold">Not available right now</span>
                </div>
                <button
                  onClick={handleRequestAvailability}
                  className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90 border-2"
                  style={{ 
                    borderColor: theme.primary,
                    color: theme.primary,
                    backgroundColor: 'transparent'
                  }}
                >
                  <Bell size={22} />
                  Request Availability
                </button>
              </div>
            ) : (
              <>
                {/* Total */}
                <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: `${theme.primary}10` }}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium" style={{ color: theme.textPrimary }}>Total</span>
                    <span className="text-2xl font-bold" style={{ color: theme.primary }}>
                      ₹{(displayPrice * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full mt-6 py-4 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: theme.buttonBg }}
                >
                  <ShoppingCart size={22} />
                  Add to Cart
                </button>
              </>
            )}

            {/* Description */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-semibold mb-3" style={{ color: theme.textPrimary }}>
                Description
              </h3>
              <p className="whitespace-pre-wrap" style={{ color: theme.textSecondary }}>
                {product.description}
              </p>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm rounded-full bg-zinc-100"
                    style={{ color: theme.textSecondary }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center mt-8" style={{ backgroundColor: theme.footerBg }}>
        <p className="text-sm text-white/70">
          Powered by{' '}
          <Link href="/" className="font-semibold text-white hover:underline" target="_blank" rel="noopener noreferrer">
            BloomBase
          </Link>
        </p>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </h2>
              <button onClick={() => setShowAuth(false)} className="p-2 hover:bg-zinc-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="form-input"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    required
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium z-10 pointer-events-none">+91</span>
                    <input
                      type="tel"
                      placeholder="XXXXXXXXXX"
                      className="form-input pl-20"
                      value={authForm.phone.replace('+91', '')}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        if (digits.length <= 10) {
                          handlePhoneChange('+91' + digits);
                        }
                      }}
                      maxLength={10}
                    />
                  </div>
                </>
              )}
              <input
                type="email"
                placeholder="Email"
                className="form-input"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="form-input"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl text-white font-semibold"
                style={{ backgroundColor: theme.buttonBg }}
              >
                {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-zinc-600">
              {authMode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button onClick={() => setAuthMode('register')} className="font-semibold" style={{ color: theme.primary }}>
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => setAuthMode('login')} className="font-semibold" style={{ color: theme.primary }}>
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Shopping Cart</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-zinc-100 rounded-lg">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {items.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <ShoppingCart className="mx-auto mb-4 opacity-30" size={48} />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.product._id} className="flex gap-4 p-3 bg-zinc-50 rounded-xl">
                      <div className="w-20 h-20 bg-zinc-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] && (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${item.product.images[0]}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-medium truncate">{item.product.name}</h4>
                        <p className="text-sm" style={{ color: theme.primary }}>
                          ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleUpdateCart(item.product._id, item.quantity - 1)}
                            className="p-1 rounded bg-zinc-200 hover:bg-zinc-300"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateCart(item.product._id, item.quantity + 1)}
                            className="p-1 rounded bg-zinc-200 hover:bg-zinc-300"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{item.lineTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold" style={{ color: theme.primary }}>
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Checkout via WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductClient({ alias, slug }: { alias: string; slug: string }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ProductContent alias={alias} slug={slug} />
    </Suspense>
  );
}

