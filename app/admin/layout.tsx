'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation'; // AÑADIDO usePathname
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, Users, Settings, LogOut, DollarSign } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // AÑADIDO

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.rol !== 'admin')) {
      router.push('/');
    }
  }, [isAuthenticated, user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.rol !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-white/10 p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
            Panel Admin
          </h2>
          <p className="text-gray-400 text-sm mt-1">{user?.nombre || 'Admin'}</p>
        </div>

        <nav className="space-y-2">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === '/admin'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          
          <Link
            href="/admin/tandas"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === '/admin/tandas'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            Tandas
          </Link>
          
          <Link
            href="/admin/productos"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === '/admin/productos'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Package className="w-5 h-5" />
            Productos
          </Link>
          
          <Link
            href="/admin/ventas"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === '/admin/ventas'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Ventas
          </Link>
        </nav>

        <button
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="absolute bottom-6 left-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Salir
        </button>
      </aside>

      {/* Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}