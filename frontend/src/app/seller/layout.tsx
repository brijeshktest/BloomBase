'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  Settings, 
  Store, 
  LogOut,
  Menu,
  X,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seller/products', label: 'Products', icon: Package },
  { href: '/seller/promotions', label: 'Promotions', icon: Tag },
  { href: '/seller/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/seller/settings', label: 'Settings', icon: Settings },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, logout, hasHydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || user?.role !== 'seller') {
      router.push('/login');
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center text-zinc-600">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'seller') return null;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-zinc-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="font-bold text-lg">{user?.businessName}</span>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-zinc-900 to-zinc-800 text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-zinc-700">
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/logo-full.svg" 
              alt="BloomBase" 
              className="h-10 w-auto"
            />
          </Link>
        </div>

        <div className="p-4">
          <div className="bg-zinc-700/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-zinc-400">Store</p>
            <p className="font-semibold truncate">{user?.businessName}</p>
            {user?.alias && (
              <Link
                href={`/store/${user.alias}`}
                target="_blank"
                className="mt-2 flex items-center text-sm text-cyan-400 hover:text-cyan-300"
              >
                <Store size={14} className="mr-1" />
                View Store
              </Link>
            )}
          </div>

          {!user?.isApproved && (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-200">Pending Approval</p>
                  <p className="text-xs text-amber-300/80 mt-1">
                    Your account is being reviewed. You can add products after approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

