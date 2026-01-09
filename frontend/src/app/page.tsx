import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Store, Smartphone, TrendingUp, Zap, Shield, Heart, Download, AppWindow, Search, ShoppingCart } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-zinc-100 text-zinc-900">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-20 w-72 h-72 bg-orange-200 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-200 rounded-full filter blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-8 animate-fade-in">
                <img 
                  src="/logo-full.svg" 
                  alt="SellLocal Online" 
                  className="h-32 sm:h-40 lg:h-48 w-auto"
                />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight animate-fade-in">
                Platform for
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-teal-600">
                  Home-Based Retailers
                </span>
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-zinc-700 max-w-2xl mx-auto animate-fade-in stagger-1">
                Our platform enables small sellers to take their business online, appear in local searches, and reach nearby societies effortlessly. Attract new customers, boost local sales, and grow your business using SEO-powered discovery and digital promotion. Cash on Delivery, WhatsApp checkout - start selling today!
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-2">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg hover:bg-orange-700 transition-all hover:scale-105 shadow-xl shadow-orange-500/30"
                >
                  Start Selling Free →
                </Link>
                <Link
                  href="#features"
                  className="px-8 py-4 bg-zinc-100 text-zinc-900 rounded-2xl font-semibold text-lg hover:bg-zinc-200 transition-all border border-zinc-300"
                >
                  Learn More
                </Link>
              </div>
              
              <p className="mt-6 text-sm text-zinc-600 animate-fade-in stagger-3">
                ✨ 1 Month Free Trial • No Credit Card Required
              </p>
              <p className="mt-4 text-sm text-zinc-600 animate-fade-in stagger-3 flex items-center justify-center gap-2">
                <Download size={16} />
                <span>PWA Enabled - Customers can add your microsite as a mobile app!</span>
              </p>
            </div>
          </div>
          
          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
            </svg>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">
                Everything You Need to
                <span className="text-orange-600"> Succeed Online</span>
              </h2>
              <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
                Powerful features designed specifically for home-based sellers
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Store,
                  title: 'List Products Online Easily',
                  description: 'Get a personalized microsite to list all your products. Upload images, set prices, and organize your inventory beautifully.',
                  color: 'bg-cyan-500',
                },
                {
                  icon: Smartphone,
                  title: 'Connect with Buyers on WhatsApp',
                  description: 'Customers checkout directly via WhatsApp. Receive orders instantly, communicate easily, no payment gateway needed.',
                  color: 'bg-emerald-500',
                },
                {
                  icon: TrendingUp,
                  title: 'Volume Pricing',
                  description: 'Set different prices based on order quantity. Encourage bulk purchases.',
                  color: 'bg-violet-500',
                },
                {
                  icon: Zap,
                  title: 'Run Promotions',
                  description: 'Create flash sales and discounts. Attract more customers with special offers.',
                  color: 'bg-amber-500',
                },
                {
                  icon: Smartphone,
                  title: 'Add to Mobile App',
                  description: 'Your customers can add your microsite as a mobile app on their phones! Works like a native app with offline support.',
                  color: 'bg-rose-500',
                },
                {
                  icon: Search,
                  title: 'SEO Optimization with Guidance',
                  description: 'We help you optimize your microsite for search engines. Our settings guide you on what to input in each field, so your store appears when customers search for products in your area.',
                  color: 'bg-purple-500',
                },
                {
                  icon: Heart,
                  title: 'Built for Home Sellers',
                  description: 'Designed specifically for small home-based businesses. Simple and effective.',
                  color: 'bg-teal-500',
                },
                {
                  icon: ShoppingCart,
                  title: 'Google Shopping Integration',
                  description: 'Get your products listed on Google Shopping for free! Automatic feed generation means your products appear when customers search on Google.',
                  color: 'bg-blue-500',
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="group p-8 bg-zinc-50 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-300 card-hover"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PWA Highlight Section */}
        <section className="py-24 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-300 rounded-full filter blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                  <Download className="w-5 h-5" />
                  <span className="text-sm font-semibold">Progressive Web App (PWA)</span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">
                  Your Microsite as a
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-cyan-200">
                    Mobile App
                  </span>
                </h2>
                
                <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                  Customers can add your SellLocal Online microsite directly to their phone's home screen! It works just like a native mobile app with offline support and push notifications.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <AppWindow className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Native App Experience</h3>
                      <p className="text-purple-100">
                        Your store feels like a real app when installed. No app store downloads needed!
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Easy Installation</h3>
                      <p className="text-purple-100">
                        Customers just tap "Add to Home Screen" on their phone browser - that's it! Your store is now an app on their device.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Offline Access</h3>
                      <p className="text-purple-100">
                        Once installed, customers can browse your products even without internet connection (previously viewed items).
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <p className="font-semibold mb-2">💡 How It Works:</p>
                  <ol className="list-decimal list-inside space-y-2 text-purple-100 text-sm">
                    <li>Customer visits your microsite on their phone</li>
                    <li>Browser shows "Add to Home Screen" prompt</li>
                    <li>Customer taps install - your store is now an app!</li>
                    <li>Your store icon appears on their home screen</li>
                    <li>Customers open it like any other app</li>
                  </ol>
                </div>
              </div>
              
              {/* Right: Visual/Illustration */}
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                  <div className="space-y-6">
                    {/* Mock Phone 1 */}
                    <div className="bg-white rounded-2xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl"></div>
                        <div>
                          <div className="h-3 bg-zinc-200 rounded w-24 mb-2"></div>
                          <div className="h-2 bg-zinc-100 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl"></div>
                        <div className="h-2 bg-zinc-200 rounded w-full"></div>
                        <div className="h-2 bg-zinc-200 rounded w-3/4"></div>
                      </div>
                      <div className="mt-4 text-xs text-center text-zinc-500">
                        Your Microsite
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                        <Download className="w-6 h-6" />
                      </div>
                    </div>
                    
                    {/* Mock Phone 2 - Installed */}
                    <div className="bg-white rounded-2xl p-6 shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl"></div>
                        <span className="text-sm font-bold text-zinc-700">Installed App</span>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center">
                        <AppWindow className="w-12 h-12 mx-auto text-purple-400 mb-2" />
                        <p className="text-xs text-zinc-600 font-semibold">Opens like a native app!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-gradient-to-br from-zinc-100 to-zinc-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">
                Get Started in
                <span className="text-orange-600"> 3 Simple Steps</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Register Your Business',
                  description: 'Sign up with your business details. Choose a theme that matches your brand.',
                },
                {
                  step: '02',
                  title: 'Add Your Products',
                  description: 'Upload product images, set prices and quantities. Add volume discounts.',
                },
                {
                  step: '03',
                  title: 'Start Selling',
                  description: 'Share your store link. Receive orders directly on WhatsApp.',
                },
              ].map((item, index) => (
                <div key={item.step} className="relative">
                  <div className="bg-white p-8 rounded-3xl shadow-lg">
                    <span className="text-6xl font-black text-zinc-200">
                      {item.step}
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 mt-4 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-zinc-600">
                      {item.description}
                    </p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-orange-300"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Google Shopping Section */}
        <section className="py-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-6">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Google Shopping</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">
                Get Your Products on <span className="text-blue-600">Google Shopping</span> - Free!
              </h2>
              <p className="text-lg text-zinc-700 max-w-3xl mx-auto">
                When customers search for products on Google, your listings can appear in Google Shopping results with images, prices, and direct links to your store. All automatically - no technical knowledge needed!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12">
              {/* Left: Benefits */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
                  <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🛍️</span>
                    What is Google Shopping?
                  </h3>
                  <p className="text-zinc-700 mb-4">
                    Google Shopping shows product listings directly in search results. When someone searches for products like yours, your store can appear with product images, prices, and a direct link - making it easy for customers to find and buy from you.
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-blue-900 font-semibold mb-2">Example:</p>
                    <p className="text-sm text-blue-800">
                      If you sell toys and someone searches "toys online" or "buy toys", your products can appear in Google Shopping results with your prices and store link!
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
                  <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    Completely Automatic
                  </h3>
                  <p className="text-zinc-700 mb-4">
                    We automatically generate a Google Merchant Center feed for your products. Just copy one URL and add it to your Google Merchant Center account - that's it! Your products sync daily automatically.
                  </p>
                  <ul className="space-y-2 text-zinc-700 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Automatic feed generation - no manual work needed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Daily automatic sync with Google</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Free to use - no additional costs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Your products appear when customers search on Google</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right: How It Works */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-cyan-100">
                  <h4 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    How It Works
                  </h4>
                  <div className="space-y-4">
                    {[
                      { step: '1', title: 'We Generate Your Feed', description: 'Every seller gets a unique product feed URL automatically generated from their products.' },
                      { step: '2', title: 'Add to Google Merchant Center', description: 'Copy your feed URL and add it to your Google Merchant Center account (free to create).' },
                      { step: '3', title: 'Google Syncs Daily', description: 'Google automatically fetches your products daily and shows them in search results.' },
                      { step: '4', title: 'Customers Find You', description: 'When customers search for products, your listings appear in Google Shopping with images and prices!' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-900 mb-1">
                              {item.title}
                            </p>
                            <p className="text-xs text-zinc-600">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                  <h4 className="font-bold text-lg mb-3">🎯 What This Means for You</h4>
                  <ul className="space-y-2 text-blue-50 text-sm">
                    <li>• More customers discover your products when searching on Google</li>
                    <li>• Your products appear alongside big online stores</li>
                    <li>• Free visibility - no advertising costs</li>
                    <li>• Automatic updates - when you add products, they sync automatically</li>
                    <li>• Professional appearance with product images and prices</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-blue-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-zinc-900 mb-2">
                  Simple Setup - Just 3 Steps
                </h3>
                <p className="text-zinc-600">
                  Get your products on Google Shopping in minutes
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: '1',
                    title: 'Get Your Feed URL',
                    description: 'In your seller settings, you\'ll find your unique Google Merchant feed URL. Just copy it!',
                    icon: '📋'
                  },
                  {
                    step: '2',
                    title: 'Add to Google Merchant Center',
                    description: 'Go to merchants.google.com, create a free account, and add your feed URL as a "Scheduled fetch" feed.',
                    icon: '🔗'
                  },
                  {
                    step: '3',
                    title: 'Start Appearing in Google Shopping',
                    description: 'Google will sync your products daily. Within hours, your products start appearing in Google Shopping results!',
                    icon: '🚀'
                  },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                      {item.icon}
                    </div>
                    <div className="text-4xl font-black text-blue-200 mb-2">{item.step}</div>
                    <h4 className="text-lg font-bold text-zinc-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-zinc-600">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
                <p className="text-sm text-blue-900 font-semibold mb-2">💡 Pro Tip:</p>
                <p className="text-sm text-blue-800">
                  Make sure your products have clear, high-quality images (HTTP/HTTPS URLs) and accurate prices. Products with stock available are automatically included in the feed. The feed updates automatically whenever you add or modify products!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Local Discovery Section - Hyperlocal SEO */}
        <section className="py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-6">
                <Search className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">Local Discovery</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">
                Get Found by Customers in Your Area
              </h2>
              <p className="text-lg text-zinc-700 max-w-3xl mx-auto">
                When customers search for products near them, your store automatically appears in search results. No technical knowledge needed - we handle everything for you!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-12">
              {/* Left: Explanation */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
                  <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🔍</span>
                    How It Works
                  </h3>
                  <p className="text-zinc-700 mb-4">
                    When you set up your store and add your location (city, area, or neighborhood), we automatically make sure your store shows up when people nearby search for products.
                  </p>
                  <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                    <p className="text-sm text-purple-900 font-semibold mb-2">Example:</p>
                    <p className="text-sm text-purple-800">
                      If you're a home baker in Delhi and someone searches for "home bakers near me" or "handmade cakes in Delhi", your store will appear in their search results!
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
                  <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    Automatic & Easy
                  </h3>
                  <p className="text-zinc-700 mb-4">
                    You don't need to do anything complicated. Just fill in your address when setting up your store, and we automatically create the right keywords and descriptions that help customers find you.
                  </p>
                  <ul className="space-y-2 text-zinc-700 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>We automatically add your city and area to search keywords</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Your store appears when customers search for products in your location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>Works for searches like "near me", "in [your city]", or "[your area]"</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right: Examples */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
                  <h4 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    Real Search Examples
                  </h4>
                  <div className="space-y-3">
                    {[
                      { search: '"handmade gifts in Delhi"', result: 'Your store appears if you sell gifts in Delhi' },
                      { search: '"toys near me"', result: 'Customers nearby see your toy store' },
                      { search: '"home bakers in [Your Area]"', result: 'Local customers find your bakery' },
                      { search: '"wholesale items [Your City]"', result: 'Business buyers in your city discover you' },
                    ].map((example, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-4 border border-orange-200">
                        <p className="text-sm font-semibold text-zinc-900 mb-1">
                          Customer searches: <span className="text-orange-600">"{example.search}"</span>
                        </p>
                        <p className="text-xs text-zinc-600">
                          → {example.result}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
                  <h4 className="font-bold text-lg mb-3">🎯 What This Means for You</h4>
                  <ul className="space-y-2 text-purple-50 text-sm">
                    <li>• More customers find you without you having to advertise</li>
                    <li>• Local customers discover your store naturally</li>
                    <li>• You compete with big online stores in your area</li>
                    <li>• No need to learn complicated SEO - we do it for you</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-purple-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-zinc-900 mb-2">
                  Simple Setup Process
                </h3>
                <p className="text-zinc-600">
                  Just three easy steps to get discovered by local customers
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: '1',
                    title: 'Add Your Location',
                    description: 'When creating your store, simply enter your city, state, and area name in the address fields.',
                    icon: '📍'
                  },
                  {
                    step: '2',
                    title: 'We Do the Magic',
                    description: 'Our system automatically creates location-based keywords and descriptions that help search engines find you.',
                    icon: '✨'
                  },
                  {
                    step: '3',
                    title: 'Get Discovered',
                    description: 'When customers search for products in your area, your store appears in their results automatically!',
                    icon: '🚀'
                  },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                      {item.icon}
                    </div>
                    <div className="text-4xl font-black text-purple-200 mb-2">{item.step}</div>
                    <h4 className="text-lg font-bold text-zinc-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-zinc-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-6">
                The Best Online Platform to List Your Products and Connect with Buyers on WhatsApp
              </h2>
              <p className="text-lg text-zinc-700 mb-6">
                Looking for an online platform to list your products and connect with buyers on WhatsApp? SellLocal Online is the perfect solution for home-based sellers, small business owners, and entrepreneurs who want to take their business online quickly and easily.
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">
                Why Choose SellLocal Online as Your Online Product Listing Platform?
              </h3>
              <ul className="list-disc list-inside space-y-3 text-zinc-700 mb-6">
                <li><strong>Easy Product Listing:</strong> List your products online in minutes with our simple interface. Upload product images, add descriptions, set prices, and organize your inventory effortlessly.</li>
                <li><strong>WhatsApp Integration:</strong> Connect directly with buyers through WhatsApp. When customers add items to cart, they're redirected to your WhatsApp for seamless order processing and communication.</li>
                <li><strong>Free Microsite:</strong> Get your own personalized microsite with a unique URL. Choose from beautiful themes to match your brand identity.</li>
                <li><strong>No Technical Skills Required:</strong> You don't need coding knowledge or technical expertise. Our platform is designed for everyone, from beginners to experienced sellers.</li>
                <li><strong>PWA - Mobile App Experience:</strong> Customers can add your microsite as a mobile app on their phone! It installs directly to their home screen and works like a native app with offline support - no app store needed!</li>
                <li><strong>SEO Optimization with Step-by-Step Guidance:</strong> We help you optimize your microsite for search engines! In your store settings, you'll find SEO fields with helpful suggestions on what to input in each field. We guide you on how to fill meta titles, descriptions, keywords, and local area information so your store appears when customers search for products near your location. No technical knowledge needed - just follow our suggestions!</li>
                <li><strong>Google Shopping Integration - Free!</strong> Get your products listed on Google Shopping automatically! We generate a Google Merchant Center feed for your products, and you can add it to Google Merchant Center with just one click. Your products will appear in Google Shopping results when customers search, giving you free visibility alongside big online stores. The feed updates automatically daily - no manual work needed!</li>
              </ul>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 p-6 rounded-r-lg mt-6">
                <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <Search size={20} className="text-purple-600" />
                  How Our SEO Guidance Works:
                </h4>
                <ul className="space-y-2 text-purple-800 text-sm">
                  <li>✓ <strong>Clear Instructions:</strong> Each SEO field in settings includes helpful text explaining what to enter</li>
                  <li>✓ <strong>Examples Provided:</strong> We show you example entries so you know exactly what to write</li>
                  <li>✓ <strong>Character Counters:</strong> We guide you on optimal length for titles and descriptions</li>
                  <li>✓ <strong>Keyword Tips:</strong> Learn which keywords help customers find your products in local searches</li>
                  <li>✓ <strong>Location Optimization:</strong> We explain how adding your area name helps local customers find you</li>
                </ul>
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">
                How to Start Listing Products and Connecting with Buyers
              </h3>
              <ol className="list-decimal list-inside space-y-3 text-zinc-700 mb-6">
                <li><strong>Register for Free:</strong> Sign up with your business details and get started with a 1-month free trial.</li>
                <li><strong>Create Your Store:</strong> Set up your microsite by choosing a theme and adding your business information.</li>
                <li><strong>List Your Products:</strong> Add products with images, descriptions, prices, and inventory details. You can also bulk upload products using Excel.</li>
                <li><strong>Connect WhatsApp:</strong> Your WhatsApp number is automatically integrated. Customers can checkout via WhatsApp directly from your store.</li>
                <li><strong>Share and Sell:</strong> Share your store link with customers. Start receiving orders and growing your business!</li>
              </ol>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg mt-8">
                <p className="text-zinc-800 font-semibold mb-2">Perfect For:</p>
                <p className="text-zinc-700">
                  Home-based sellers, handmade craft businesses, local food vendors, small manufacturers, online resellers, and anyone who wants to list products online and connect with buyers through WhatsApp. If you're searching for an online platform to showcase your products and communicate with customers via WhatsApp, SellLocal Online is your answer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Wholesale & Product Categories SEO Section */}
        <section className="py-24 bg-gradient-to-br from-zinc-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">
                Platform for <span className="text-orange-600">Home-Based Retailers</span>
              </h2>
              <p className="text-lg text-zinc-600 max-w-3xl mx-auto">
                SellLocal Online is the perfect platform for home-based retailers who buy items in bulk from wholesale markets. List your products and offer customers better prices than online e-commerce platforms. Cash on delivery, WhatsApp checkout - everything you need to compete with big online stores.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                { category: 'Toys', keywords: 'wholesale toy market, toys, toy supplier' },
                { category: 'Gift Items', keywords: 'gift items, wholesale gifts, gift supplier' },
                { category: 'School Supplies', keywords: 'school supplies, stationery, educational products' },
                { category: 'Home Decor', keywords: 'home decor, home decoration, decorative items' },
                { category: 'Kitchen Items', keywords: 'kitchen items, kitchenware, kitchen products' },
                { category: 'Beddings', keywords: 'beddings, bedding, bed sheets, blankets' },
              ].map((item) => (
                <div key={item.category} className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">{item.category}</h3>
                  <p className="text-sm text-zinc-600 mb-4">
                    List {item.category.toLowerCase()} at better prices than online stores. Since you buy in bulk from wholesale markets, offer competitive rates and cash on delivery to attract customers.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.keywords.split(', ').map((keyword) => (
                      <span key={keyword} className="px-2 py-1 bg-zinc-100 rounded text-xs text-zinc-600">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Location-Based SEO Section */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-8 text-center">
              <span className="text-orange-600">Home-Based Retailers</span> - List Your Products Online
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-zinc-700 mb-6">
                Are you a <strong>home-based retailer</strong> who buys items in bulk from <strong>wholesale markets</strong>? SellLocal Online helps you create an online store where customers can discover your products at better prices than online e-commerce platforms. Whether you sell toys, gift items, school supplies, home decor, kitchen items, beddings, or any other products, SellLocal Online makes it easy to compete with big online stores.
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">
                Features for Home-Based Retailers
              </h3>
              <ul className="list-disc list-inside space-y-3 text-zinc-700 mb-6">
                <li><strong>Better Prices Than Online Stores:</strong> Since you buy in bulk from wholesale markets, you can offer customers better rates than online e-commerce platforms. Display your competitive prices and attract price-conscious buyers.</li>
                <li><strong>Source from Wholesale Markets:</strong> Perfect for retailers who buy items in bulk from wholesale markets. List your products and compete with online platforms by offering better deals.</li>
                <li><strong>Cash on Delivery:</strong> WhatsApp checkout allows you to handle COD orders. Customers checkout via WhatsApp and you can arrange cash on delivery as per your terms.</li>
                <li><strong>Product Categories:</strong> List toys, gift items, school supplies, home decor, kitchen items, beddings, and more. Organize products by category for easy discovery.</li>
                <li><strong>Location-Based SEO:</strong> When customers search for products in your area, your store can appear in search results, helping local customers find you.</li>
              </ul>
              <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">
                Why Customers Choose SellLocal Online Retailers
              </h3>
              <ul className="list-disc list-inside space-y-3 text-zinc-700 mb-6">
                <li>Better prices than online e-commerce platforms</li>
                <li>Compare rates from multiple home-based retailers easily</li>
                <li>View product images and details before ordering</li>
                <li>Find sellers who source from wholesale markets at competitive rates</li>
                <li>Contact sellers directly via WhatsApp</li>
                <li>Cash on delivery options available</li>
                <li>Search by location to find local retailers</li>
              </ul>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mt-8">
                <p className="text-zinc-800 font-semibold mb-2">🎯 Target Keywords:</p>
                <p className="text-zinc-700 text-sm mb-3">
                  SellLocal Online is optimized to appear in search results when customers search for:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'sadar bazar delhi',
                    'wholesale toy market',
                    'wholesale',
                    'cheapest rate',
                    'toy',
                    'gift items',
                    'school supplies',
                    'home decor',
                    'kitchen items',
                    'beddings',
                    'best rates',
                    'cash on delivery',
                    'bulk supply'
                  ].map((keyword) => (
                    <span key={keyword} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-zinc-700 border border-amber-200">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-5xl font-black mb-6">
              Start Your Home-Based Retail Business Online Today
            </h2>
            <p className="text-xl text-orange-50 mb-10">
              Whether you're buying from wholesale markets anywhere in India, list your products and offer customers better prices than online e-commerce platforms. Cash on delivery (COD), WhatsApp checkout, and reach more customers. Join home-based retailers offering toys, gift items, school supplies, home decor, kitchen items, beddings at competitive rates.
            </p>
            <Link
              href="/register"
              className="inline-block px-10 py-5 bg-white text-orange-700 rounded-2xl font-bold text-lg hover:bg-orange-50 transition-all hover:scale-105 shadow-xl"
            >
              Start Listing Products Free →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
