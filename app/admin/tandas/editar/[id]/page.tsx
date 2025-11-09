'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTanda, updateTanda } from '@/app/services/tandasService';
import { supabase } from '@/app/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Check, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function EditarTandaPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [numerosReservados, setNumerosReservados] = useState<number[]>([]);
  const [numerosOriginales, setNumerosOriginales] = useState<number[]>([]);
  const [participantesOcupados, setParticipantesOcupados] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    monto: '',
    participantes_max: '',
    duracion: '',
    frecuencia: 'Mensual',
    imagen: '💰',
    color: 'from-yellow-500 to-orange-500',
    disponible: true,
  });

  const emojis = [
    { emoji: '💰', label: 'Dinero' },
    { emoji: '💎', label: 'Diamante' },
    { emoji: '⚡', label: 'Rayo' },
    { emoji: '👑', label: 'Corona' },
    { emoji: '🎯', label: 'Diana' },
    { emoji: '🔥', label: 'Fuego' },
    { emoji: '⭐', label: 'Estrella' },
    { emoji: '🎁', label: 'Regalo' }
  ];

  const colores = [
    { name: 'Amarillo-Naranja', value: 'from-yellow-500 to-orange-500' },
    { name: 'Azul-Cyan', value: 'from-blue-500 to-cyan-500' },
    { name: 'Morado-Rosa', value: 'from-purple-500 to-pink-500' },
    { name: 'Ámbar-Amarillo', value: 'from-amber-500 to-yellow-500' },
    { name: 'Verde-Esmeralda', value: 'from-green-500 to-emerald-500' },
    { name: 'Rojo-Rosa', value: 'from-red-500 to-pink-500' },
  ];

  const numerosTotales = formData.participantes_max 
    ? Array.from({ length: parseInt(formData.participantes_max) }, (_, i) => i + 1)
    : [];

  useEffect(() => {
    loadTanda();
  }, [params.id]);

  // Limpiar selección si el número de participantes baja
  useEffect(() => {
    const maxParticipantes = parseInt(formData.participantes_max) || 0;
    setNumerosReservados(prev => 
      prev.filter(num => num <= maxParticipantes)
    );
  }, [formData.participantes_max]);

  const loadTanda = async () => {
    try {
      console.log('🔍 Cargando tanda:', params.id);
      
      // Cargar datos de la tanda
      const tanda = await getTanda(params.id as string);
      if (!tanda) {
        toast.error('Tanda no encontrada');
        router.push('/admin/tandas');
        return;
      }

      setFormData({
        nombre: tanda.nombre,
        monto: tanda.monto.toString(),
        participantes_max: tanda.participantes_max.toString(),
        duracion: tanda.duracion,
        frecuencia: tanda.frecuencia,
        imagen: tanda.imagen,
        color: tanda.color,
        disponible: tanda.disponible,
      });

      // Cargar números RESERVADOS (de la tabla numeros_reservados)
      const { data: reservados, error: reservadosError } = await supabase
        .from('numeros_reservados')
        .select('numero')
        .eq('tanda_id', params.id)
        .order('numero', { ascending: true });

      if (reservadosError) {
        console.error('❌ Error cargando números reservados:', reservadosError);
      } else {
        const numeros = reservados?.map(r => r.numero) || [];
        console.log('✅ Números reservados:', numeros);
        setNumerosReservados(numeros);
        setNumerosOriginales(numeros);
      }

      // Cargar números OCUPADOS por participantes (para mostrar como info)
      const { data: participantes, error: participantesError } = await supabase
        .from('tanda_participantes')
        .select('turno')
        .eq('tanda_id', params.id);

      if (!participantesError && participantes) {
        const ocupados = participantes.map(p => p.turno);
        console.log('👥 Números ocupados por participantes:', ocupados);
        setParticipantesOcupados(ocupados);
      }

    } catch (error) {
      console.error('💥 Error cargando tanda:', error);
      toast.error('Error al cargar la tanda');
      router.push('/admin/tandas');
    } finally {
      setLoading(false);
    }
  };

  const toggleNumero = (numero: number) => {
    // No permitir reservar números que ya están ocupados por participantes
    if (participantesOcupados.includes(numero)) {
      toast.error(`El número ${numero} ya está ocupado por un participante`);
      return;
    }

    setNumerosReservados(prev => {
      if (prev.includes(numero)) {
        return prev.filter(n => n !== numero);
      } else {
        return [...prev, numero].sort((a, b) => a - b);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('💾 Guardando cambios...');

      // 1. Actualizar datos de la tanda
      await updateTanda(params.id as string, {
        nombre: formData.nombre,
        monto: Number(formData.monto),
        participantes_max: Number(formData.participantes_max),
        duracion: formData.duracion,
        frecuencia: formData.frecuencia,
        imagen: formData.imagen,
        color: formData.color,
        disponible: formData.disponible,
      });

      // 2. Actualizar números RESERVADOS
      const numerosAEliminar = numerosOriginales.filter(
        num => !numerosReservados.includes(num)
      );

      const numerosAAgregar = numerosReservados.filter(
        num => !numerosOriginales.includes(num)
      );

      console.log('➖ Números a desreservar:', numerosAEliminar);
      console.log('➕ Números a reservar:', numerosAAgregar);

      // Eliminar números que ya no están reservados
      if (numerosAEliminar.length > 0) {
        const { error: deleteError } = await supabase
          .from('numeros_reservados')
          .delete()
          .eq('tanda_id', params.id)
          .in('numero', numerosAEliminar);

        if (deleteError) {
          console.error('❌ Error eliminando reservas:', deleteError);
          toast.error('Error al actualizar números reservados');
        } else {
          console.log('✅ Reservas eliminadas correctamente');
        }
      }

      // Agregar nuevos números reservados
      if (numerosAAgregar.length > 0) {
        const nuevasReservas = numerosAAgregar.map(numero => ({
          tanda_id: params.id as string,
          numero: numero
        }));

        const { error: insertError } = await supabase
          .from('numeros_reservados')
          .insert(nuevasReservas);

        if (insertError) {
          console.error('❌ Error agregando reservas:', insertError);
          toast.error('Error al agregar números reservados');
        } else {
          console.log('✅ Reservas agregadas correctamente');
        }
      }

      toast.success('✅ Tanda actualizada correctamente');
      router.push('/admin/tandas');
    } catch (error: any) {
      console.error('💥 Error guardando:', error);
      toast.error(error.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <Link
        href="/admin/tandas"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Editar Tanda</h1>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Columna Izquierda - Formulario */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            
            <div>
              <label className="block text-white font-semibold mb-2">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Monto</label>
              <input
                type="number"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Participantes Máximos
              </label>
              <input
                type="number"
                value={formData.participantes_max}
                onChange={(e) => setFormData({ ...formData, participantes_max: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                min="1"
                max="100"
                required
              />
              {participantesOcupados.length > 0 && (
                <p className="text-yellow-400 text-sm mt-2">
                  ⚠️ Hay {participantesOcupados.length} participantes inscritos
                </p>
              )}
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Duración</label>
              <input
                type="text"
                value={formData.duracion}
                onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="12 meses"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Frecuencia</label>
              <select
                value={formData.frecuencia}
                onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Semanal">Semanal</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.disponible}
                  onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                  className="w-5 h-5 accent-purple-500"
                />
                <span className="text-white font-semibold">Disponible para inscripciones</span>
              </label>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Emoji</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {emojis.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, imagen: item.emoji })}
                    className={`aspect-square flex items-center justify-center text-3xl sm:text-4xl p-2 sm:p-3 rounded-xl border-2 transition-all ${
                      formData.imagen === item.emoji
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    title={item.label}
                  >
                    <span role="img" aria-label={item.label}>
                      {item.emoji}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Color</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colores.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-purple-500'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className={`h-8 rounded-lg bg-gradient-to-r ${color.value} mb-2`} />
                    <p className="text-white text-sm">{color.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha - Selector de Números */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-red-400" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Números Reservados
                  </h2>
                </div>
                {numerosReservados.length > 0 && (
                  <div className="bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-full w-fit">
                    <span className="text-red-400 font-bold text-sm">
                      {numerosReservados.length} reservado(s)
                    </span>
                  </div>
                )}
              </div>

              {numerosTotales.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">
                    Define el número de participantes para ver los números
                  </p>
                </div>
              ) : (
                <div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-400 text-sm font-semibold mb-1">
                          Administrar Números Reservados
                        </p>
                        <p className="text-yellow-200 text-xs">
                          Los números reservados no podrán ser elegidos por usuarios.
                          Los números azules ya están ocupados por participantes.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Leyenda */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500/30 border border-green-500 rounded" />
                      <span className="text-gray-300">Disponible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500/30 border border-blue-500 rounded" />
                      <span className="text-gray-300">Ocupado (participante)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500/30 border border-red-500 rounded" />
                      <span className="text-gray-300">Reservado (admin)</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-2 sm:gap-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-2">
                    <AnimatePresence>
                      {numerosTotales.map((numero) => {
                        const isReservado = numerosReservados.includes(numero);
                        const isOcupado = participantesOcupados.includes(numero);
                        
                        return (
                          <motion.button
                            key={numero}
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={!isOcupado ? { scale: 1.05 } : {}}
                            whileTap={!isOcupado ? { scale: 0.95 } : {}}
                            onClick={() => !isOcupado && toggleNumero(numero)}
                            disabled={isOcupado}
                            className={`relative aspect-square rounded-lg sm:rounded-xl border-2 font-bold text-base sm:text-xl transition-all ${
                              isOcupado
                                ? 'bg-blue-500/30 border-blue-500 text-blue-300 cursor-not-allowed'
                                : isReservado
                                ? 'bg-red-500/30 border-red-500 text-white cursor-pointer'
                                : 'bg-white/5 border-white/10 hover:border-white/30 text-gray-300 hover:text-white cursor-pointer'
                            }`}
                            title={
                              isOcupado
                                ? `#${numero} - Ocupado por participante`
                                : isReservado
                                ? `#${numero} - Click para quitar reserva`
                                : `#${numero} - Click para reservar`
                            }
                          >
                            {numero}
                            {isReservado && !isOcupado && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </motion.div>
                            )}
                            {isOcupado && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center"
                              >
                                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {numerosReservados.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                    >
                      <p className="text-white font-bold mb-2 text-sm sm:text-base">
                        Números reservados por administrador:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {numerosReservados.map((num) => (
                          <span
                            key={num}
                            className="bg-red-500/30 border border-red-500/50 px-2 sm:px-3 py-1 rounded-lg text-white font-bold text-xs sm:text-sm"
                          >
                            #{num}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setNumerosReservados([])}
                        className="mt-3 text-red-400 hover:text-red-300 text-sm font-bold"
                      >
                        Quitar todas las reservas
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
                <Link
                  href="/admin/tandas"
                  className="block text-center px-6 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>

      <style jsx global>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 10px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.7);
        }
      `}</style>
    </div>
  );
}