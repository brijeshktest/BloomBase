'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { productApi, authApi, cartApi, availabilityApi } from '@/lib/api';
import { Product, Store as StoreType } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { getTheme, ThemeKey } from '@/lib/themes';
import { trackEvent } from '@/utils/analytics';
import VisitorRegistrationModal from '@/components/VisitorRegistrationModal';
import toast from 'react-hot-toast';
import {
  Search,
  ShoppingCart,
  Package,
  Filter,
  X,
  User,
  LogIn,
  Plus,
  Minus,
  ChevronDown,
  AlertCircle,
  Bell,
  Tag,
  ArrowRight
} from 'lucide-react';

function StoreContent({ alias }: { alias: string }) {
  const searchParams = useSearchParams();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { items, setCart } = useCartStore();
  
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store all products for price range calculation
  const [categories, setCategories] = useState<string[]>([]);
  const [activePromotions, setActivePromotions] = useState<Array<{
    _id: string;
    name: string;
    discountType: 'percentage' | 'absolute';
    discountValue: number;
    applyToAll: boolean;
  }>>([]);
  const [search, setSearch] = useState(searchParams?.get('search') || '');
  const [category, setCategory] = useState(searchParams?.get('category') || '');
  const [priceRange, setPriceRange] = useState('');
  const [sort, setSort] = useState('newest');
  const [onSale, setOnSale] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showCart, setShowCart] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '+91',
  });
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorRegistered, setVisitorRegistered] = useState(false);
  const [siteBlocked, setSiteBlocked] = useState(false); // Start unblocked, block when modal appears

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

  const theme = store ? getTheme((store.theme as ThemeKey) || 'minimal') : getTheme('minimal');

  useEffect(() => {
    // Check if visitor already registered in this session
    const isRegistered = sessionStorage.getItem('selllocalonline_visitor_registered') === 'true';
    setVisitorRegistered(isRegistered);
    
    if (!isRegistered) {
      // Show modal after 5 seconds, then block site
      const timer = setTimeout(() => {
        setShowVisitorModal(true);
        setSiteBlocked(true); // Block site when modal appears
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setSiteBlocked(false);
    }
  }, []);

  useEffect(() => {
    // Always fetch products, but only track if registered or not blocked
    fetchProducts();
    // Track page view only if visitor is registered
    if (alias && (visitorRegistered || !siteBlocked)) {
      trackEvent(alias, 'page_view', { page: 'store_home' });
    }
  }, [alias, search, category, sort, onSale, priceRange]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'buyer') {
      fetchCart();
    }
  }, [isAuthenticated, alias]);

  const handleVisitorRegistrationComplete = () => {
    setShowVisitorModal(false);
    setVisitorRegistered(true);
    setSiteBlocked(false);
    fetchProducts();
    if (alias) {
      trackEvent(alias, 'page_view', { page: 'store_home' });
    }
  };

  // Calculate price ranges dynamically based on product prices
  const calculatePriceRanges = (products: Product[]) => {
    if (products.length === 0) return [];
    
    const prices = products.map(p => {
      const currentPrice = p.discountedPrice || p.basePrice;
      return currentPrice;
    }).filter(p => p > 0);
    
    if (prices.length === 0) return [];
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Determine if prices are in hundreds, thousands, or tens of thousands
    const isInThousands = maxPrice >= 1000;
    const isInTensOfThousands = maxPrice >= 10000;
    
    const ranges: Array<{ label: string; min: number; max: number }> = [];
    
    if (isInTensOfThousands) {
      // For prices in tens of thousands (10k+)
      ranges.push({ label: 'Under ₹10,000', min: 0, max: 10000 });
      ranges.push({ label: '₹10,000 - ₹25,000', min: 10000, max: 25000 });
      ranges.push({ label: '₹25,000 - ₹50,000', min: 25000, max: 50000 });
      ranges.push({ label: '₹50,000 - ₹1,00,000', min: 50000, max: 100000 });
      ranges.push({ label: 'Above ₹1,00,000', min: 100000, max: Infinity });
    } else if (isInThousands) {
      // For prices in thousands (1k-10k)
      ranges.push({ label: 'Under ₹100', min: 0, max: 100 });
      ranges.push({ label: '₹100 - ₹300', min: 100, max: 300 });
      ranges.push({ label: '₹300 - ₹500', min: 300, max: 500 });
      ranges.push({ label: '₹500 - ₹1,000', min: 500, max: 1000 });
      ranges.push({ label: '₹1,000 - ₹5,000', min: 1000, max: 5000 });
      ranges.push({ label: 'Above ₹5,000', min: 5000, max: Infinity });
    } else {
      // For prices under 1000
      ranges.push({ label: 'Under ₹100', min: 0, max: 100 });
      ranges.push({ label: '₹100 - ₹300', min: 100, max: 300 });
      ranges.push({ label: '₹300 - ₹500', min: 300, max: 500 });
      ranges.push({ label: '₹500 - ₹1,000', min: 500, max: 1000 });
      ranges.push({ label: 'Above ₹1,000', min: 1000, max: Infinity });
    }
    
    return ranges;
  };

  const filterProductsByPriceRange = (products: Product[], range: string) => {
    if (!range) return products;
    
    const ranges = calculatePriceRanges(products);
    const selectedRange = ranges.find(r => r.label === range);
    if (!selectedRange) return products;
    
    return products.filter(p => {
      const currentPrice = p.discountedPrice || p.basePrice;
      return currentPrice >= selectedRange.min && 
             (selectedRange.max === Infinity || currentPrice < selectedRange.max);
    });
  };

  const fetchProducts = async () => {
    try {
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
      if (category) params.category = category;
      if (sort) params.sort = sort;
      if (onSale) params.onSale = '1';

      const response = await productApi.getStoreProducts(alias, params);
      const fetchedProducts = response.data.products;
      
      // Store all products for price range calculation
      setAllProducts(fetchedProducts);
      
      // Apply price range filter if selected
      let filteredProducts = fetchedProducts;
      if (priceRange) {
        filteredProducts = filterProductsByPriceRange(fetchedProducts, priceRange);
      }
      
      setProducts(filteredProducts);
      setCategories(response.data.categories);
      setStore(response.data.store);
      setActivePromotions(response.data.activePromotions || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  const handlePromotionBannerClick = () => {
    setOnSale(!onSale);
    // Clear other filters when toggling sale filter
    if (!onSale) {
      setSearch('');
      setCategory('');
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

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    // Check if product is out of stock
    if ((product.stock || 0) === 0) {
      toast.error('This product is currently out of stock');
      return;
    }

    try {
      await cartApi.add({
        productId: product._id,
        quantity: product.minimumOrderQuantity,
        sellerAlias: alias,
      });
      // Track add to cart event
      trackEvent(alias, 'add_to_cart', {
        productId: product._id,
        buyerId: user?._id || user?.id,
        metadata: { quantity: product.minimumOrderQuantity, productName: product.name }
      });
      toast.success('Added to cart');
      fetchCart();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleRequestAvailability = async (product: Product) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    try {
      const response = await availabilityApi.requestAvailability({
        productId: product._id,
        sellerAlias: alias,
      });
      toast.success('Request sent to seller! They will be notified.');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleUpdateCart = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await cartApi.remove(alias, productId);
      } else {
        await cartApi.update({ productId, quantity, sellerAlias: alias });
      }
      fetchCart();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update cart');
    }
  };

  const handleCheckout = async () => {
    try {
      // Track checkout initiated
      trackEvent(alias, 'checkout_initiated', {
        buyerId: user?._id || user?.id,
        metadata: { 
          cartItems: items.length, 
          cartTotal: cartTotal,
          items: items.map(i => ({ productId: i.product._id, quantity: i.quantity }))
        }
      });
      
      const response = await cartApi.checkout(alias);
      window.open(response.data.whatsappUrl, '_blank');
      
      // Track checkout completed
      trackEvent(alias, 'checkout_completed', {
        buyerId: user?._id || user?.id,
        metadata: { 
          cartItems: items.length, 
          cartTotal: cartTotal,
          whatsappUrl: response.data.whatsappUrl
        }
      });
      
      setCart([], 0, alias);
      setShowCart(false);
      toast.success('Order sent to WhatsApp!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Checkout failed');
    }
  };

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + item.lineTotal, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.background }}>
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Store Not Found</h1>
          <Link href="/" className="text-cyan-600 hover:underline">
            Go to SellLocal Online
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: theme.background }}>
      {/* Visitor Registration Modal */}
      {showVisitorModal && (
        <VisitorRegistrationModal
          sellerAlias={alias}
          onComplete={handleVisitorRegistrationComplete}
          theme={theme}
        />
      )}

      {/* Block site content until visitor registers */}
      {siteBlocked && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
      )}
      
      <div style={{ pointerEvents: siteBlocked ? 'none' : 'auto', opacity: siteBlocked ? 0.5 : 1 }}>
      {/* Header */}
      <header style={{ backgroundColor: theme.headerBg }} className="text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {store.logo && (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${store.logo}`}
                  alt={store.businessName}
                  className="h-12 w-auto rounded-xl object-contain flex-shrink-0"
                />
              )}
              <h1 className="text-xl font-bold truncate">{store.businessName}</h1>
              
              {/* Mobile Social Media Icons */}
              {(store.instagramHandle || store.facebookHandle) && (
                <div className="md:hidden flex items-center gap-2 ml-2">
                  <span className="text-xs opacity-80">Follow:</span>
                  {store.instagramHandle && (
                    <a
                      href={`https://instagram.com/${store.instagramHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:scale-110 transition-transform"
                      onClick={() => trackEvent(alias, 'social_click', { platform: 'instagram' })}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <defs>
                          <linearGradient id="instagram-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f09433" />
                            <stop offset="25%" stopColor="#e6683c" />
                            <stop offset="50%" stopColor="#dc2743" />
                            <stop offset="75%" stopColor="#cc2366" />
                            <stop offset="100%" stopColor="#bc1888" />
                          </linearGradient>
                        </defs>
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#instagram-gradient-mobile)"/>
                      </svg>
                    </a>
                  )}
                  {store.facebookHandle && (
                    <a
                      href={`https://facebook.com/${store.facebookHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:scale-110 transition-transform"
                      onClick={() => trackEvent(alias, 'social_click', { platform: 'facebook' })}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Social Media Icons */}
              {(store.instagramHandle || store.facebookHandle) && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <span className="text-sm opacity-90">Follow us on</span>
                  <div className="flex items-center gap-2">
                    {store.instagramHandle && (
                      <a
                        href={`https://instagram.com/${store.instagramHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:scale-110 transition-transform"
                        onClick={() => trackEvent(alias, 'social_click', { platform: 'instagram' })}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <defs>
                            <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#f09433" />
                              <stop offset="25%" stopColor="#e6683c" />
                              <stop offset="50%" stopColor="#dc2743" />
                              <stop offset="75%" stopColor="#cc2366" />
                              <stop offset="100%" stopColor="#bc1888" />
                            </linearGradient>
                          </defs>
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#instagram-gradient)"/>
                        </svg>
                      </a>
                    )}
                    {store.facebookHandle && (
                      <a
                        href={`https://facebook.com/${store.facebookHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:scale-110 transition-transform"
                        onClick={() => trackEvent(alias, 'social_click', { platform: 'facebook' })}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {isAuthenticated && user?.role === 'buyer' ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm hidden sm:inline opacity-80">Hi, {user.name.split(' ')[0]}</span>
                  <button
                    onClick={() => logout()}
                    className="text-sm opacity-80 hover:opacity-100"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">Login</span>
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

      {/* Banner */}
      {store.banner && (
        <div className="relative w-full" style={{ aspectRatio: '4.8/1', maxHeight: '500px' }}>
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${store.banner}`}
            alt={`${store.businessName} banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Promotion Banner */}
      {activePromotions.length > 0 && !onSale && (
        <div className="w-full bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 py-4 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handlePromotionBannerClick}
              className="w-full flex items-center justify-between gap-4 text-white hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-full">
                  <Tag size={24} className="sm:w-6 sm:h-6" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-lg sm:text-xl font-bold">SALE LIVE NOW!</span>
                  {activePromotions.map((promo, idx) => (
                    <span key={promo._id} className="text-sm sm:text-base font-semibold">
                      {idx > 0 && ' • '}
                      {promo.name}
                      {promo.discountType === 'percentage' ? (
                        <span className="ml-1 bg-white/30 px-2 py-0.5 rounded-md">
                          {promo.discountValue}% OFF
                        </span>
                      ) : (
                        <span className="ml-1 bg-white/30 px-2 py-0.5 rounded-md">
                          ₹{promo.discountValue} OFF
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                <span>View Sale Products</span>
                <ArrowRight size={20} className="sm:w-5 sm:h-5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Active Sale Filter Indicator */}
      {onSale && activePromotions.length > 0 && (
        <div className="w-full bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 py-3 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 text-white flex-wrap">
              <Tag size={20} />
              <span className="font-semibold">Showing Sale Products</span>
              <div className="flex items-center gap-2 flex-wrap">
                {activePromotions.map((promo) => (
                  <span key={promo._id} className="text-sm bg-white/20 px-2 py-0.5 rounded-md">
                    {promo.name}
                    {promo.discountType === 'percentage' ? (
                      <span className="ml-1 font-bold">{promo.discountValue}% OFF</span>
                    ) : (
                      <span className="ml-1 font-bold">₹{promo.discountValue} OFF</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setOnSale(false)}
              className="text-white hover:bg-white/20 px-4 py-1.5 rounded-lg transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
            >
              View All Products
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-0 bg-white shadow-lg focus:ring-2"
              style={{ '--tw-ring-color': theme.primary } as React.CSSProperties}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white shadow-lg sm:hidden"
          >
            <Filter size={20} />
            Filters
          </button>
          <div className="hidden sm:flex gap-3">
            <select
              className="px-4 py-3 rounded-xl bg-white shadow-lg border-0"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              className="px-4 py-3 rounded-xl bg-white shadow-lg border-0"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="">All Prices</option>
              {calculatePriceRanges(allProducts).map(range => (
                <option key={range.label} value={range.label}>{range.label}</option>
              ))}
            </select>
            <select
              className="px-4 py-3 rounded-xl bg-white shadow-lg border-0"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A-Z</option>
            </select>
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-col gap-3 sm:hidden">
            <select
              className="w-full px-4 py-3 rounded-xl bg-white shadow-lg border-0"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              className="w-full px-4 py-3 rounded-xl bg-white shadow-lg border-0"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="">All Prices</option>
              {calculatePriceRanges(allProducts).map(range => (
                <option key={range.label} value={range.label}>{range.label}</option>
              ))}
            </select>
            <select
              className="w-full px-4 py-3 rounded-xl bg-white shadow-lg border-0"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {products.length === 0 ? (
          <div className="py-16 text-center" style={{ backgroundColor: theme.cardBg, borderRadius: '1.5rem' }}>
            <Package className="mx-auto mb-4 opacity-30" size={64} style={{ color: theme.textPrimary }} />
            <p style={{ color: theme.textSecondary }}>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="rounded-xl overflow-hidden shadow-md transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: theme.cardBg }}
              >
                <Link 
                  href={`/store/${alias}/product/${product.slug}`}
                  onClick={() => {
                    trackEvent(alias, 'product_view', {
                      productId: product._id,
                      buyerId: user?._id || user?.id,
                      page: 'store_listing'
                    });
                  }}
                >
                  <div className="aspect-square relative bg-zinc-100">
                    {product.images[0] ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${product.images[0]}`}
                        alt={product.name}
                        className={`w-full h-full object-contain bg-white ${(product.stock || 0) === 0 ? 'opacity-50' : ''}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="opacity-20" size={32} />
                      </div>
                    )}
                    {(product.stock || 0) === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          Not Available
                        </span>
                      </div>
                    )}
                    {product.hasPromotion && (product.stock || 0) > 0 && (
                      <span
                        className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-xs font-bold text-white rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      >
                        {product.promotion?.discountType === 'percentage'
                          ? `${product.promotion.discountValue}% OFF`
                          : `₹${product.promotion?.discountValue} OFF`}
                      </span>
                    )}
                  </div>
                </Link>
                
                <div className="p-3">
                  <Link 
                    href={`/store/${alias}/product/${product.slug}`}
                    onClick={() => {
                      trackEvent(alias, 'product_view', {
                        productId: product._id,
                        buyerId: user?._id || user?.id,
                        page: 'store_listing'
                      });
                    }}
                  >
                    <h3 className="font-semibold text-sm truncate" style={{ color: theme.textPrimary }}>
                      {product.name}
                    </h3>
                    <p className="text-xs opacity-60 mt-0.5 truncate" style={{ color: theme.textSecondary }}>
                      {product.category}
                    </p>
                  </Link>
                  
                  {(product.stock || 0) === 0 ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-1.5 text-red-600">
                        <AlertCircle size={14} />
                        <span className="text-xs font-medium">Not available right now</span>
                      </div>
                      <button
                        onClick={() => handleRequestAvailability(product)}
                        className="w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border-2 transition-colors"
                        style={{ 
                          borderColor: theme.primary,
                          color: theme.primary,
                          backgroundColor: 'transparent'
                        }}
                      >
                        <Bell size={14} />
                        Request Availability
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {product.hasPromotion && product.discountedPrice ? (
                            <>
                              <span className="text-base font-bold" style={{ color: theme.primary }}>
                                ₹{product.discountedPrice.toFixed(0)}
                              </span>
                              <span className="text-xs line-through ml-1.5 opacity-50">
                                ₹{product.basePrice}
                              </span>
                            </>
                          ) : (
                            <span className="text-base font-bold" style={{ color: theme.primary }}>
                              ₹{product.basePrice}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="p-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: theme.buttonBg }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      {product.minimumOrderQuantity > 1 && (
                        <p className="text-xs opacity-50 mt-1.5" style={{ color: theme.textSecondary }}>
                          Min. order: {product.minimumOrderQuantity}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center" style={{ backgroundColor: theme.footerBg }}>
        <p className="text-sm text-white/70">
          Powered by{' '}
          <Link href="/" className="font-semibold text-white hover:underline" target="_blank" rel="noopener noreferrer">
            SellLocal Online
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
    </div>
  );
}

export default function StoreClient({ alias }: { alias: string }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <StoreContent alias={alias} />
    </Suspense>
  );
}

