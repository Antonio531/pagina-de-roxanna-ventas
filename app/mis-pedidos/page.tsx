'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrdenesUsuario, OrdenDetalle } from '../services/ordenesService';
import { Package, Calendar, DollarSign, Hash, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MisPedidosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<OrdenDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrdenes = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getOrdenesUsuario(user.id);
    setOrdenes(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadOrdenes();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-8">
          Mis Pedidos
        </h1>

        {ordenes.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg sm:text-xl">No tienes pedidos aún</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {ordenes.map((orden) => (
              <div
                key={orden.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/10 transition-all"
              >
                {/* Header - Responsivo */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      orden.tipo === 'tanda' 
                        ? 'bg-purple-500/20' 
                        : 'bg-blue-500/20'
                    }`}>
                      {orden.tipo === 'tanda' ? (
                        <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                      ) : (
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                        {orden.tipo === 'tanda' ? 'Números de Tanda' : 'Productos'}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">
                            {new Date(orden.created_at).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </span>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold w-fit ${
                          orden.estado === 'pagado' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {orden.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Precio - Responsivo */}
                  <div className="text-left sm:text-right">
                    <div className="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl font-bold text-white">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                      <span className="break-all">${orden.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Detalles - Tandas */}
                {orden.tipo === 'tanda' && orden.participaciones && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-400 mb-3">
                      Números comprados:
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                      {orden.participaciones.map((part, idx) => (
                        <div
                          key={idx}
                          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 sm:p-4 text-center"
                        >
                          <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">
                            #{part.turno}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {part.tanda_nombre}
                          </div>
                          <div className="flex items-center justify-center gap-1 text-xs text-green-400 mt-2">
                            <CheckCircle className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{part.estado}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detalles - Productos */}
                {orden.tipo === 'productos' && orden.items && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-400 mb-3">
                      Productos:
                    </h4>
                    <div className="space-y-2">
                      {orden.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 bg-white/5 rounded-xl p-3 sm:p-4"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-white text-sm sm:text-base truncate">
                                {item.nombre}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-400">
                                Cantidad: {item.cantidad}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-white text-sm sm:text-base whitespace-nowrap">
                              ${item.precio.toLocaleString()}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-400">
                              c/u
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
