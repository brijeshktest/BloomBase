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
    <header className="bg-gradient-to-r from-zinc-50 via-white to-zinc-50 text-zinc-900 shadow-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/logo-full.svg" 
              alt="SellLocal Online" 
              className="h-14 sm:h-16 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors text-zinc-900"
                  >
                    <LayoutDashboard size={18} />
                    <span>Admin Panel</span>
                  </Link>
                )}
                {user?.role === 'seller' && (
                  <>
                    <Link
                      href="/seller/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors text-zinc-900"
                    >
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </Link>
                    {user.alias && (
                      <Link
                        href={`/store/${user.alias}`}
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors text-orange-900"
                        target="_blank"
                      >
                        <Store size={18} />
                        <span>View Store</span>
                      </Link>
                    )}
                  </>
                )}
                <div className="flex items-center space-x-4 pl-4 border-l border-white/20">
                  <span className="text-sm text-zinc-700">
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
                  className="px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-900"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-colors"
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
        <div className="md:hidden bg-white backdrop-blur-lg border-t border-zinc-200">
          <div className="px-4 py-4 space-y-3">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-zinc-100 text-zinc-900"
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
                      className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-zinc-100 text-zinc-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </Link>
                    {user.alias && (
                      <Link
                        href={`/store/${user.alias}`}
                        className="flex items-center space-x-2 px-4 py-3 rounded-lg bg-orange-100 text-orange-900"
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
                  className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg bg-red-100 text-red-700"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-3 rounded-lg hover:bg-zinc-100 text-zinc-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-3 rounded-lg bg-orange-600 text-white text-center font-semibold hover:bg-orange-700"
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

