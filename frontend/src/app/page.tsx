import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Store, Smartphone, TrendingUp, Zap, Shield, Heart, Download, AppWindow } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-400 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400 rounded-full filter blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-6 animate-fade-in">
                <img 
                  src="/logo-full.svg" 
                  alt="BloomBase" 
                  className="h-24 w-auto"
                />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight animate-fade-in">
                Wholesale Marketplace for
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-green-300">
                  Best Rates & Bulk Supply
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl mt-4">Sadar Bazar Delhi • Cash on Delivery</span>
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-cyan-100 max-w-2xl mx-auto animate-fade-in stagger-1">
                List toys, gift items, school supplies, home decor, kitchen items, beddings at cheapest rates. Perfect for wholesale sellers in Sadar Bazar Delhi. Bulk supply, COD, best rates - all with WhatsApp checkout!
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-2">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-white text-teal-900 rounded-2xl font-bold text-lg hover:bg-cyan-100 transition-all hover:scale-105 shadow-xl shadow-black/20"
                >
                  Start Selling Free →
                </Link>
                <Link
                  href="#features"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
                >
                  Learn More
                </Link>
              </div>
              
              <p className="mt-6 text-sm text-cyan-200 animate-fade-in stagger-3">
                ✨ 1 Month Free Trial • No Credit Card Required
              </p>
              <p className="mt-4 text-sm text-cyan-300 animate-fade-in stagger-3 flex items-center justify-center gap-2">
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
                <span className="text-cyan-600"> Succeed Online</span>
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
                  icon: Heart,
                  title: 'Built for Home Sellers',
                  description: 'Designed specifically for small home-based businesses. Simple and effective.',
                  color: 'bg-teal-500',
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
                  Customers can add your BloomBase microsite directly to their phone's home screen! It works just like a native mobile app with offline support and push notifications.
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
                <span className="text-cyan-600"> 3 Simple Steps</span>
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
                    <span className="text-6xl font-black text-cyan-100">
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
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-cyan-300"></div>
                  )}
                </div>
              ))}
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
                Looking for an online platform to list your products and connect with buyers on WhatsApp? BloomBase is the perfect solution for home-based sellers, small business owners, and entrepreneurs who want to take their business online quickly and easily.
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">
                Why Choose BloomBase as Your Online Product Listing Platform?
              </h3>
              <ul className="list-disc list-inside space-y-3 text-zinc-700 mb-6">
                <li><strong>Easy Product Listing:</strong> List your products online in minutes with our simple interface. Upload product images, add descriptions, set prices, and organize your inventory effortlessly.</li>
                <li><strong>WhatsApp Integration:</strong> Connect directly with buyers through WhatsApp. When customers add items to cart, they're redirected to your WhatsApp for seamless order processing and communication.</li>
                <li><strong>Free Microsite:</strong> Get your own personalized microsite with a unique URL. Choose from beautiful themes to match your brand identity.</li>
                <li><strong>No Technical Skills Required:</strong> You don't need coding knowledge or technical expertise. Our platform is designed for everyone, from beginners to experienced sellers.</li>
                <li><strong>PWA - Mobile App Experience:</strong> Customers can add your microsite as a mobile app on their phone! It installs directly to their home screen and works like a native app with offline support - no app store needed!</li>
                <li><strong>SEO Optimized:</strong> Your microsite is automatically optimized for search engines, helping customers in your area find your products when they search online.</li>
              </ul>
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
              <div className="bg-cyan-50 border-l-4 border-cyan-500 p-6 rounded-r-lg mt-8">
                <p className="text-zinc-800 font-semibold mb-2">Perfect For:</p>
                <p className="text-zinc-700">
                  Home-based sellers, handmade craft businesses, local food vendors, small manufacturers, online resellers, and anyone who wants to list products online and connect with buyers through WhatsApp. If you're searching for an online platform to showcase your products and communicate with customers via WhatsApp, BloomBase is your answer.
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
                Wholesale Marketplace for <span className="text-cyan-600">Best Rates & Bulk Supply</span>
              </h2>
              <p className="text-lg text-zinc-600 max-w-3xl mx-auto">
                BloomBase is the perfect platform for wholesale sellers in Sadar Bazar Delhi and across India to list their products and reach customers looking for bulk supply at cheapest rates with cash on delivery options.
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
                    List {item.category.toLowerCase()} at best wholesale rates. Offer bulk supply and cash on delivery to attract more buyers.
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

            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-black mb-4">Why Choose BloomBase for Wholesale Business?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-lg mb-2">💰 Best Rates & Cheapest Prices</h4>
                  <p className="text-cyan-100">
                    Showcase your products at the cheapest rates. Volume-based pricing helps you offer better deals for bulk orders, attracting more wholesale buyers.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">📦 Bulk Supply Made Easy</h4>
                  <p className="text-cyan-100">
                    Set minimum order quantities and volume discounts. Perfect for wholesale sellers who want to sell in bulk at competitive rates.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">🚚 Cash on Delivery (COD)</h4>
                  <p className="text-cyan-100">
                    With WhatsApp checkout, you can handle cash on delivery orders directly. Customers checkout via WhatsApp and you can arrange COD delivery.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">📍 Perfect for Sadar Bazar Delhi Sellers</h4>
                  <p className="text-cyan-100">
                    If you're selling in Sadar Bazar Delhi or any wholesale market, BloomBase helps you create an online presence. Customers searching for "sadar bazar delhi wholesale" or "wholesale toy market" can find your store.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location-Based SEO Section */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-8 text-center">
              Wholesale Sellers in <span className="text-cyan-600">Sadar Bazar Delhi</span> - List Your Products Online
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-zinc-700 mb-6">
                Are you a wholesale seller in <strong>Sadar Bazar Delhi</strong> looking to expand your reach? BloomBase helps you create an online store where customers can discover your products, compare rates, and place bulk orders. Whether you sell toys, gift items, school supplies, home decor, kitchen items, beddings, or any other products, BloomBase makes it easy to go digital.
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">
                Features for Wholesale Sellers
              </h3>
              <ul className="list-disc list-inside space-y-3 text-zinc-700 mb-6">
                <li><strong>Best Rates & Cheapest Prices:</strong> Display your wholesale rates clearly. Use volume pricing to offer better rates for bulk purchases, making your store the go-to place for cheapest rates.</li>
                <li><strong>Bulk Supply:</strong> Set minimum order quantities and offer discounts for bulk orders. Perfect for wholesale buyers looking for bulk supply deals.</li>
                <li><strong>Cash on Delivery:</strong> WhatsApp checkout allows you to handle COD orders. Customers checkout via WhatsApp and you can arrange cash on delivery as per your terms.</li>
                <li><strong>Product Categories:</strong> List toys, gift items, school supplies, home decor, kitchen items, beddings, and more. Organize products by category for easy discovery.</li>
                <li><strong>Location-Based SEO:</strong> When customers search for "sadar bazar delhi wholesale toy market" or "wholesale beddings delhi cheapest rate", your store can appear in search results if you're located in that area.</li>
              </ul>
              <h3 className="text-2xl font-bold text-zinc-900 mt-8 mb-4">
                Why Wholesale Buyers Choose BloomBase Sellers
              </h3>
              <ul className="list-disc list-inside space-y-3 text-zinc-700 mb-6">
                <li>Compare rates from multiple sellers easily</li>
                <li>Find bulk suppliers at cheapest rates</li>
                <li>View product images and details before ordering</li>
                <li>Check minimum order quantities for bulk supply</li>
                <li>Contact sellers directly via WhatsApp</li>
                <li>Cash on delivery options available</li>
                <li>Search by location (e.g., "sadar bazar delhi") to find local sellers</li>
              </ul>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mt-8">
                <p className="text-zinc-800 font-semibold mb-2">🎯 Target Keywords:</p>
                <p className="text-zinc-700 text-sm mb-3">
                  BloomBase is optimized to appear in search results when customers search for:
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
        <section className="py-24 bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-5xl font-black mb-6">
              Start Your Wholesale Business Online Today
            </h2>
            <p className="text-xl text-cyan-100 mb-10">
              Whether you're in Sadar Bazar Delhi or anywhere in India, list your wholesale products at best rates. Offer bulk supply, cash on delivery (COD), and reach more customers. Join thousands of sellers offering toys, gift items, school supplies, home decor, kitchen items, beddings at cheapest rates.
            </p>
            <Link
              href="/register"
              className="inline-block px-10 py-5 bg-white text-cyan-700 rounded-2xl font-bold text-lg hover:bg-cyan-50 transition-all hover:scale-105 shadow-xl"
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
