'use client';

import { useEffect, useState } from 'react';
import { getTandas, deleteTanda, TandaConParticipantes } from '@/app/services/tandasService';
import { supabase } from '@/app/lib/supabase';
import { Edit, Trash2, Plus, Eye, Users, Lock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface TandaExtendida extends TandaConParticipantes {
  numeros_reservados?: number;
}

export default function AdminTandasPage() {
  const [tandas, setTandas] = useState<TandaExtendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTandas();
  }, []);

  const loadTandas = async () => {
    setLoading(true);
    try {
      // Obtener tandas con participantes
      const tandasData = await getTandas();
      
      // Obtener números reservados para cada tanda
      const tandasConReservados = await Promise.all(
        tandasData.map(async (tanda) => {
          const { count } = await supabase
            .from('numeros_reservados')
            .select('*', { count: 'exact', head: true })
            .eq('tanda_id', tanda.id);
          
          return {
            ...tanda,
            numeros_reservados: count || 0
          };
        })
      );
      
      setTandas(tandasConReservados);
    } catch (error) {
      console.error('Error cargando tandas:', error);
      toast.error('Error al cargar tandas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la tanda "${nombre}"?\n\nEsto eliminará también:\n• Los números reservados\n• Los participantes inscritos`)) {
      return;
    }

    setDeleting(id);
    try {
      await deleteTanda(id);
      toast.success('Tanda eliminada exitosamente');
      loadTandas();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la tanda');
    } finally {
      setDeleting(null);
    }
  };

  // Calcular disponibles reales
  const getDisponiblesReales = (tanda: TandaExtendida) => {
    const ocupados = tanda.participantes_count;
    const reservados = tanda.numeros_reservados || 0;
    const total = tanda.participantes_max;
    return total - ocupados - reservados;
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Gestionar Tandas</h1>
          <p className="text-gray-400 mt-2">Administra todas las tandas activas</p>
        </div>
        <Link
          href="/admin/tandas/nueva"
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Nueva Tanda
        </Link>
      </div>

      {/* Resumen de estadísticas */}
      {!loading && tandas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Tandas</p>
            <p className="text-2xl font-bold text-white">{tandas.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Tandas Activas</p>
            <p className="text-2xl font-bold text-green-400">
              {tandas.filter(t => t.disponible).length}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Participantes</p>
            <p className="text-2xl font-bold text-blue-400">
              {tandas.reduce((sum, t) => sum + t.participantes_count, 0)}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Números Reservados</p>
            <p className="text-2xl font-bold text-red-400">
              {tandas.reduce((sum, t) => sum + (t.numeros_reservados || 0), 0)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : tandas.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No hay tandas creadas</h3>
          <p className="text-gray-400 mb-6">Comienza creando tu primera tanda</p>
          <Link
            href="/admin/tandas/nueva"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Primera Tanda
          </Link>
        </div>
      ) : (
        <>
          {/* Vista Desktop - Tabla */}
          <div className="hidden lg:block bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-semibold">Tanda</th>
                    <th className="text-left p-4 text-gray-400 font-semibold">Monto</th>
                    <th className="text-center p-4 text-gray-400 font-semibold">Participantes</th>
                    <th className="text-center p-4 text-gray-400 font-semibold">Reservados</th>
                    <th className="text-center p-4 text-gray-400 font-semibold">Disponibles</th>
                    <th className="text-left p-4 text-gray-400 font-semibold">Frecuencia</th>
                    <th className="text-center p-4 text-gray-400 font-semibold">Estado</th>
                    <th className="text-right p-4 text-gray-400 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tandas.map((tanda) => {
                    const disponiblesReales = getDisponiblesReales(tanda);
                    const estaLlena = disponiblesReales <= 0;
                    
                    return (
                      <tr key={tanda.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{tanda.imagen}</span>
                            <div>
                              <p className="text-white font-semibold">{tanda.nombre}</p>
                              <p className="text-gray-400 text-sm">{tanda.duracion}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-white font-bold">
                          ${tanda.monto.toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-white">
                              {tanda.participantes_count}/{tanda.participantes_max}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
  {(tanda.numeros_reservados ?? 0) > 0 ? (
    <div className="flex items-center justify-center gap-1">
      <Lock className="w-4 h-4 text-red-400" />
      <span className="text-red-400 font-bold">
        {tanda.numeros_reservados ?? 0} reservados
      </span>
    </div>
  ) : (
    <span className="text-gray-500">Sin reservas</span>
  )}
</td>
                        <td className="p-4 text-center">
                          <span className={`font-bold ${
                            disponiblesReales > 5 ? 'text-green-400' : 
                            disponiblesReales > 0 ? 'text-yellow-400' : 
                            'text-gray-500'
                          }`}>
                            {disponiblesReales}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">{tanda.frecuencia}</td>
                        <td className="p-4 text-center">
                          {estaLlena ? (
                            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                              Llena
                            </span>
                          ) : (
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                              Disponible
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/tandas/ver/${tanda.id}`}
                              className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            
                            <Link
                              href={`/admin/tandas/editar/${tanda.id}`}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                              title="Editar tanda"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            
                            <button
                              onClick={() => handleDelete(tanda.id, tanda.nombre)}
                              disabled={deleting === tanda.id}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                              title="Eliminar tanda"
                            >
                              {deleting === tanda.id ? (
                                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista Mobile - Cards */}
          <div className="lg:hidden space-y-4">
            {tandas.map((tanda) => {
              const disponiblesReales = getDisponiblesReales(tanda);
              const estaLlena = disponiblesReales <= 0;
              
              return (
                <div key={tanda.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{tanda.imagen}</span>
                      <div>
                        <h3 className="text-white font-bold">{tanda.nombre}</h3>
                        <p className="text-gray-400 text-sm">{tanda.duracion}</p>
                      </div>
                    </div>
                    {estaLlena ? (
                      <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-bold">
                        Llena
                      </span>
                    ) : (
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-bold">
                        Disponible
                      </span>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-gray-400 text-xs">Monto</p>
                      <p className="text-white font-bold">${tanda.monto.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-gray-400 text-xs">Frecuencia</p>
                      <p className="text-white font-bold">{tanda.frecuencia}</p>
                    </div>
                  </div>

                  {/* Participantes */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-3 h-3 text-blue-400" />
                        <p className="text-xs text-gray-400">Inscritos</p>
                      </div>
                      <p className="text-white font-bold">
                        {tanda.participantes_count}/{tanda.participantes_max}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Lock className="w-3 h-3 text-red-400" />
                        <p className="text-xs text-gray-400">Reservados</p>
                      </div>
                      <p className="text-red-400 font-bold">
                        {tanda.numeros_reservados || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Disponibles</p>
                      <p className={`font-bold ${
                        disponiblesReales > 5 ? 'text-green-400' : 
                        disponiblesReales > 0 ? 'text-yellow-400' : 
                        'text-gray-500'
                      }`}>
                        {disponiblesReales}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/tandas/ver/${tanda.id}`}
                      className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Link>
                    
                    <Link
                      href={`/admin/tandas/editar/${tanda.id}`}
                      className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(tanda.id, tanda.nombre)}
                      disabled={deleting === tanda.id}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleting === tanda.id ? (
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}