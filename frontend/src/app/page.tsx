import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Store, Smartphone, TrendingUp, Zap, Shield, Heart } from 'lucide-react';

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
                Bring Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-green-300">
                  Home Business
                </span>
                Online
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-cyan-100 max-w-2xl mx-auto animate-fade-in stagger-1">
                Create your beautiful online store in minutes. No coding required. 
                Start selling to customers in your area today.
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
                  title: 'Your Own Microsite',
                  description: 'Get a personalized store with your business name. Beautiful themes to choose from.',
                  color: 'bg-cyan-500',
                },
                {
                  icon: Smartphone,
                  title: 'WhatsApp Checkout',
                  description: 'Customers checkout directly via WhatsApp. Easy communication, no payment gateway needed.',
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
                  icon: Shield,
                  title: 'Mobile Optimized',
                  description: 'Your store works perfectly on all devices. PWA enabled for app-like experience.',
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

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-5xl font-black mb-6">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-cyan-100 mb-10">
              Join thousands of home-based sellers who have taken their business online with BloomBase.
            </p>
            <Link
              href="/register"
              className="inline-block px-10 py-5 bg-white text-cyan-700 rounded-2xl font-bold text-lg hover:bg-cyan-50 transition-all hover:scale-105 shadow-xl"
            >
              Create Your Store Now →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
