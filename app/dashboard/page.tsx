'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Package, 
  Hash, 
  ShoppingBag, 
  Calendar,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { getOrdenesUsuario, OrdenDetalle } from '../services/ordenesService';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<OrdenDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getOrdenesUsuario(user.id);
    setOrdenes(data);
    setLoading(false);
  };

  // Estadísticas
  const stats = {
    totalOrdenes: ordenes.length,
    ordenesProductos: ordenes.filter(o => o.tipo === 'productos').length,
    ordenesTandas: ordenes.filter(o => o.tipo === 'tanda').length,
    totalGastado: ordenes.reduce((sum, o) => sum + o.total, 0),
    numerosActivos: ordenes
      .filter(o => o.tipo === 'tanda')
      .reduce((sum, o) => sum + (o.participaciones?.length || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ¡Hola, {user?.nombre}! 👋
          </h1>
         
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Pedidos */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-white">
                {stats.totalOrdenes}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Total Pedidos</p>
          </div>

          {/* Productos */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-white">
                {stats.ordenesProductos}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Pedidos de Productos</p>
          </div>

          {/* Números Tanda */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <Hash className="w-6 h-6 text-pink-400" />
              </div>
              <span className="text-3xl font-bold text-white">
                {stats.numerosActivos}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Números en Tandas</p>
          </div>

          {/* Total Gastado */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                ${stats.totalGastado.toLocaleString()}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Total Gastado</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/tandas"
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 hover:shadow-2xl transition-all group"
          >
            <Hash className="w-10 h-10 text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">
              Explorar Tandas
            </h3>
            <p className="text-white/80 text-sm">
              Únete a nuevas tandas disponibles
            </p>
          </Link>

          <Link
            href="/productos"
            className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 hover:shadow-2xl transition-all group"
          >
            <Package className="w-10 h-10 text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">
              Ver Productos
            </h3>
            <p className="text-white/80 text-sm">
              Descubre productos increíbles
            </p>
          </Link>

          <Link
            href="/mis-pedidos"
            className="bg-gradient-to-br from-pink-600 to-orange-600 rounded-2xl p-6 hover:shadow-2xl transition-all group"
          >
            <ShoppingBag className="w-10 h-10 text-white mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold text-white mb-2">
              Mis Pedidos
            </h3>
            <p className="text-white/80 text-sm">
              Revisa tu historial completo
            </p>
          </Link>
        </div>

        {/* Pedidos Recientes */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Pedidos Recientes
            </h2>
            <Link
              href="/mis-pedidos"
              className="text-purple-400 hover:text-purple-300 text-sm font-bold transition-colors"
            >
              Ver todos →
            </Link>
          </div>

          {ordenes.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No tienes pedidos aún</p>
              <Link
                href="/productos"
                className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold transition-colors"
              >
                Explorar Productos
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {ordenes.slice(0, 5).map((orden) => (
                <div
                  key={orden.id}
                  className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        orden.tipo === 'tanda' 
                          ? 'bg-purple-500/20' 
                          : 'bg-blue-500/20'
                      }`}>
                        {orden.tipo === 'tanda' ? (
                          <Hash className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Package className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-bold">
                          {orden.tipo === 'tanda' ? 'Números de Tanda' : 'Productos'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {new Date(orden.created_at).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        ${orden.total.toLocaleString()}
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                        {orden.estado}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Personal */}
        <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {user?.nombre}
              </h2>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Teléfono</p>
              <p className="text-white font-bold">
                {user?.telefono || 'No registrado'}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-gray-400 text-sm mb-1">Rol</p>
              <p className="text-white font-bold capitalize">
                {user?.rol || 'Usuario'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}