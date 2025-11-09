'use client';

import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Calcular total limpio
  const total = cart.reduce((sum, item) => {
    const precio = Number(item.precio) || 0;
    const cantidad = Number(item.quantity) || 1;
    return sum + precio * cantidad;
  }, 0);

  // ✅ FUNCIÓN - solo redirige a /envio
  const handleCheckout = () => {
    if (!isAuthenticated || !user) {
      toast.error('Debes iniciar sesión');
      router.push('/login');
      return;
    }
    router.push('/envio');
  };

  // Carrito vacío
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="w-20 h-20 text-gray-600 mx-auto mb-6 sm:w-24 sm:h-24" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-400 mb-8 text-sm sm:text-base">
            Agrega productos para comenzar
          </p>
          <Link
            href="/productos"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:shadow-lg transition-all text-sm sm:text-base"
          >
            Ver Productos
          </Link>
        </div>
      </div>
    );
  }

  // Carrito con productos
  return (
    <div className="min-h-screen bg-slate-950 py-10 sm:py-12 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-2 sm:gap-0 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Tu Carrito</h1>
          <span className="text-gray-400 text-sm sm:text-base">
            {cart.length} producto(s)
          </span>
        </div>

        {/* Items */}
        <div className="space-y-4 mb-8">
          {cart.map((item) => {
            const precio = Number(item.precio) || 0;
            const cantidad = Number(item.quantity) || 1;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/[0.05] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">
                  {/* Imagen producto */}
                  <div className="text-5xl sm:text-6xl text-center sm:text-left">
                    {item.imagen}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                      {item.nombre}
                    </h3>
                    <div className="text-sm text-gray-400">
                      Precio unitario: ${precio.toLocaleString()}
                    </div>
                  </div>

                  {/* Cantidad y botones */}
                  <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, cantidad - 1))}
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>

                    <span className="text-white font-bold text-base sm:text-lg w-8 text-center">
                      {cantidad}
                    </span>

                    <button
                      onClick={() => updateQuantity(item.id, cantidad + 1)}
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>

                  {/* Precio total */}
                  <div className="text-xl sm:text-2xl font-bold text-white text-center sm:text-right min-w-[100px] sm:min-w-[120px]">
                    ${(precio * cantidad).toLocaleString()}
                  </div>

                  {/* Eliminar */}
                  <div className="flex justify-center sm:justify-end">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Total */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 text-center sm:text-left gap-2">
            <span className="text-lg sm:text-xl text-gray-400">Total:</span>
            <span className="text-3xl sm:text-4xl font-bold text-white">
              ${total.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Vaciar */}
            <button
              onClick={clearCart}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 sm:py-4 rounded-xl font-bold transition-all text-sm sm:text-base"
            >
              Vaciar Carrito
            </button>

            {/* Proceder al pago */}
            <button
              onClick={handleCheckout}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 sm:py-4 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              Proceder al Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
