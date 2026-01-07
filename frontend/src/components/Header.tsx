'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LogOut, LayoutDashboard, Store, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-900 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/logo-full.svg" 
              alt="BloomBase" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <LayoutDashboard size={18} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                {user?.role === 'seller' && (
                  <>
                    <Link
                      href="/seller/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </Link>
                    {user.alias && (
                      <Link
                        href={`/store/${user.alias}`}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/40 transition-colors"
                        target="_blank"
                      >
                        <Store size={18} />
                        <span>View Store</span>
                      </Link>
                    )}
                  </>
                )}
                <div className="flex items-center space-x-4 pl-4 border-l border-white/20">
                  <span className="text-sm text-cyan-200">
                    Hi, {user?.name?.split(' ')[0]}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-colors"
                >
                  Start Selling
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-teal-900/95 backdrop-blur-lg border-t border-white/10">
          <div className="px-4 py-4 space-y-3">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-white/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard size={18} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                {user?.role === 'seller' && (
                  <>
                    <Link
                      href="/seller/dashboard"
                      className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </Link>
                    {user.alias && (
                      <Link
                        href={`/store/${user.alias}`}
                        className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-cyan-500/30"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Store size={18} />
                        <span>View Store</span>
                      </Link>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg bg-red-500/20 text-red-200"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-3 rounded-lg hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-3 rounded-lg bg-cyan-500 text-center font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Start Selling
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

