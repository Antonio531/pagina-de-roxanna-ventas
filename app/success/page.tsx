'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user } = useAuth();
  const { clearCart } = useCart();
  const hasCleared = useRef(false); // ⭐ Bandera para ejecutar solo una vez

  useEffect(() => {
    // Solo limpia el carrito UNA vez
    if (!hasCleared.current && sessionId) {
      clearCart();
      hasCleared.current = true;
    }
  }, [sessionId]); // Solo depende del sessionId

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          ¡Pago Exitoso! 🎉
        </h1>

        <p className="text-gray-400 mb-8">
          {user 
            ? `Gracias ${user.nombre || user.email}, tu pago fue procesado correctamente.`
            : 'Tu pago ha sido procesado correctamente. Recibirás un correo de confirmación.'
          }
        </p>

        {sessionId && (
          <p className="text-xs text-gray-500 mb-6">
            ID: {sessionId.slice(-12)}
          </p>
        )}

        <div className="flex gap-4">
          <Link
            href="/"
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Volver al Inicio
          </Link>

          <Link
            href="/mis-pedidos"
            className="flex-1 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition-all"
          >
            Mis Pedidos
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
