"use client";
import Link from "next/link";
import { ShoppingCart, User, LogOut, Receipt } from "lucide-react"; // ← AGREGAR Receipt
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { cart } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const totalCount = cart.reduce((s, i) => s + (i.quantity ?? 0), 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push('/login');
  };

  return (
    <nav className="w-full fixed top-0 left-0 z-50 bg-slate-900/70 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
          RoxShop
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-purple-400 transition">Inicio</Link>
          <Link href="/tandas" className="hover:text-purple-400 transition">Tandas</Link>
          <Link href="/productos" className="hover:text-purple-400 transition">Productos</Link>
          {/* ← AGREGAR PEDIDOS AQUÍ */}
          {isAuthenticated && (
            <Link href="/mis-pedidos" className="hover:text-purple-400 transition flex items-center gap-1">
              <Receipt className="w-4 h-4" />
              Pedidos
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-white"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link href="/Carrito" className="relative group">
            <ShoppingCart className="w-6 h-6 group-hover:text-purple-400 transition" />
            {mounted && totalCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-xs rounded-full px-1.5">
                {totalCount}
              </span>
            )}
          </Link>

          {/* Desktop Auth Section */}
          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">{user.nombre}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="hidden sm:inline-block bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-xl text-sm font-semibold transition"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-menu"
        aria-hidden={!open}
        className={
          "sm:hidden bg-slate-900/95 border-t border-white/5 transform origin-top transition-all duration-200 ease-out absolute left-0 right-0 top-full w-full " +
          (open
            ? "scale-y-100 opacity-100 pointer-events-auto"
            : "scale-y-0 opacity-0 pointer-events-none")
        }
        style={{ zIndex: 60 }}
      >
        <div className="px-6 py-4 flex flex-col gap-3">
          <Link href="/" onClick={() => setOpen(false)} className="block hover:text-purple-400">Inicio</Link>
          <Link href="/tandas" onClick={() => setOpen(false)} className="block hover:text-purple-400">Tandas</Link>
          <Link href="/productos" onClick={() => setOpen(false)} className="block hover:text-purple-400">Productos</Link>
          
          {/* ← AGREGAR PEDIDOS MOBILE AQUÍ */}
          {isAuthenticated && (
            <Link href="/mis-pedidos" onClick={() => setOpen(false)} className="flex items-center gap-2 hover:text-purple-400">
              <Receipt className="w-4 h-4" />
              Mis Pedidos
            </Link>
          )}
          
          <div className="flex items-center gap-4 pt-2 border-t border-white/10">
            <Link href="/Carrito" onClick={() => setOpen(false)} className="relative">
              <ShoppingCart className="w-6 h-6 inline-block" />
              {mounted && totalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-500 text-xs rounded-full px-1.5">
                  {totalCount}
                </span>
              )}
            </Link>
            
            {/* Mobile Auth Section */}
            {isAuthenticated && user ? (
              <div className="flex flex-col gap-2 flex-1">
                <Link 
                  href="/dashboard" 
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user.nombre}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                onClick={() => setOpen(false)} 
                className="bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-xl text-sm font-semibold transition flex-1 text-center"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
