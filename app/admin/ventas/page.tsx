'use client';

import { useEffect, useState } from 'react';
import { getVentasProductos, VentaDetalle } from '@/app/services/ventasService';
import { Package, User, MapPin, Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminVentasPage() {
  const [ventas, setVentas] = useState<VentaDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadVentas();
  }, []);

  const loadVentas = async () => {
    setLoading(true);
    const data = await getVentasProductos();
    setVentas(data);
    setLoading(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const totalVentas = ventas.length;
  const ingresosTotales = ventas.reduce((sum, v) => sum + v.total, 0);
  const clientesUnicos = new Set(ventas.map(v => v.usuario?.email).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Ventas de Productos</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-purple-400" />
            <span className="text-gray-400">Total Ventas</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalVentas}</div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-green-400" />
            <span className="text-gray-400">Ingresos Totales</span>
          </div>
          <div className="text-3xl font-bold text-white">${ingresosTotales.toLocaleString()}</div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 text-blue-400" />
            <span className="text-gray-400">Clientes Únicos</span>
          </div>
          <div className="text-3xl font-bold text-white">{clientesUnicos}</div>
        </div>
      </div>

      {/* Lista de Ventas */}
      <div className="space-y-4">
        {ventas.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No hay ventas registradas</p>
          </div>
        ) : (
          ventas.map((venta) => (
            <div
              key={venta.id}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            >
              {/* Header - Siempre Visible */}
              <div
                onClick={() => toggleExpand(venta.id)}
                className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        Orden #{venta.orden_id.slice(0, 8)}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {venta.usuario?.nombre || 'Anónimo'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(venta.created_at).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        ${venta.total.toLocaleString()}
                      </div>
                      <span className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-full font-bold">
                        {venta.estado}
                      </span>
                    </div>
                    {expandedId === venta.id ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Detalles Expandibles */}
              <AnimatePresence>
                {expandedId === venta.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-6 space-y-6">
                      {/* Información del Cliente */}
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-5 h-5 text-blue-400" />
                          <h4 className="text-white font-bold">Cliente</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Nombre:</span>
                            <span className="text-white font-semibold">{venta.usuario?.nombre || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Email:</span>
                            <span className="text-white font-semibold">{venta.usuario?.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Teléfono:</span>
                            <span className="text-white font-semibold">{venta.usuario?.telefono || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Productos */}
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-5 h-5 text-purple-400" />
                          <h4 className="text-white font-bold">Productos</h4>
                        </div>
                        <div className="space-y-2">
                          {venta.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
                              <span className="text-gray-300">
                                {item.cantidad}x {item.nombre}
                              </span>
                              <span className="text-white font-bold">
                                ${(item.precio * item.cantidad).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dirección de Envío */}
                      {venta.direccion_envio && (
                        <div className="bg-white/5 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-5 h-5 text-green-400" />
                            <h4 className="text-white font-bold">Dirección de Envío</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Destinatario:</span>
                              <span className="text-white font-semibold">
                                {venta.direccion_envio.nombre_completo}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Teléfono:</span>
                              <span className="text-white font-semibold">
                                {venta.direccion_envio.telefono}
                              </span>
                            </div>
                            <div className="text-white">
                              <p>
                                {venta.direccion_envio.calle} {venta.direccion_envio.numero_exterior}
                                {venta.direccion_envio.numero_interior && ` Int. ${venta.direccion_envio.numero_interior}`}
                              </p>
                              <p>{venta.direccion_envio.colonia}, {venta.direccion_envio.ciudad}, {venta.direccion_envio.estado}</p>
                              <p>CP {venta.direccion_envio.codigo_postal}</p>
                              {venta.direccion_envio.referencias && (
                                <p className="text-gray-400 mt-2">
                                  Referencias: {venta.direccion_envio.referencias}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}