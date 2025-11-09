'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTanda } from '@/app/services/tandasService';
import { supabase } from '@/app/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Check } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function NuevaTandaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [numerosSeleccionados, setNumerosSeleccionados] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    monto: '',
    participantes_max: '',
    duracion: '',
    frecuencia: 'Mensual',
    imagen: '💰',
    color: 'from-yellow-500 to-orange-500',
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

  // Generar array de números según participantes_max
  const numerosTotales = formData.participantes_max 
    ? Array.from({ length: parseInt(formData.participantes_max) }, (_, i) => i + 1)
    : [];

  // Limpiar selección si el número de participantes baja
  useEffect(() => {
    const maxParticipantes = parseInt(formData.participantes_max) || 0;
    setNumerosSeleccionados(prev => 
      prev.filter(num => num <= maxParticipantes)
    );
  }, [formData.participantes_max]);

  const toggleNumero = (numero: number) => {
    setNumerosSeleccionados(prev => {
      if (prev.includes(numero)) {
        return prev.filter(n => n !== numero);
      } else {
        return [...prev, numero].sort((a, b) => a - b);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('📝 Creando tanda...');
      
      // Crear la tanda
      const { tanda, error: tandaError } = await createTanda({
        nombre: formData.nombre,
        monto: Number(formData.monto),
        participantes_max: Number(formData.participantes_max),
        duracion: formData.duracion,
        frecuencia: formData.frecuencia,
        imagen: formData.imagen,
        color: formData.color,
      });

      if (tandaError) {
        console.error('❌ Error al crear tanda:', tandaError);
        throw tandaError;
      }

      if (!tanda) {
        throw new Error('No se pudo crear la tanda');
      }

      console.log('✅ Tanda creada:', tanda);

      // Si hay números seleccionados, guardarlos como reservados
      if (numerosSeleccionados.length > 0) {
        console.log('📝 Reservando números:', numerosSeleccionados);
        
        // Preparar los números reservados para insertar
        const numerosReservados = numerosSeleccionados.map(numero => ({
          tanda_id: tanda.id,
          numero: numero
        }));

        console.log('📝 Insertando en numeros_reservados:', numerosReservados);

        const { error: reservadosError } = await supabase
          .from('numeros_reservados')
          .insert(numerosReservados);

        if (reservadosError) {
          console.error('❌ Error al reservar números:', reservadosError);
          console.error('❌ Detalles del error:', {
            message: reservadosError.message,
            details: reservadosError.details,
            hint: reservadosError.hint,
            code: reservadosError.code
          });
          
          // La tanda se creó, pero hubo error con los números
          toast.error('⚠️ Tanda creada, pero no se pudieron reservar los números');
        } else {
          console.log('✅ Números reservados exitosamente');
          toast.success(`✅ Tanda creada con ${numerosSeleccionados.length} número(s) reservado(s)`);
        }
      } else {
        toast.success('✅ Tanda creada exitosamente');
      }

      // Navegar a la lista de tandas
      router.push('/admin/tandas');
      
    } catch (error: any) {
      console.error('💥 Error general:', error);
      toast.error(error.message || 'Error al crear tanda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Link
        href="/admin/tandas"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Nueva Tanda</h1>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Columna Izquierda - Formulario */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            
            {/* Nombre */}
            <div>
              <label className="block text-white font-semibold mb-2">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Tanda Mensual Premium"
                required
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-white font-semibold mb-2">Monto</label>
              <input
                type="number"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="10000"
                required
              />
            </div>

            {/* Participantes Máximos */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Participantes Máximos
              </label>
              <input
                type="number"
                value={formData.participantes_max}
                onChange={(e) => setFormData({ ...formData, participantes_max: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="20"
                min="1"
                max="100"
                required
              />
              <p className="text-gray-400 text-sm mt-2">
                Se generarán {formData.participantes_max || 0} números para seleccionar
              </p>
            </div>

            {/* Duración */}
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

            {/* Frecuencia */}
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

            {/* Emoji */}
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

            {/* Color */}
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
                  <Users className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Números de Participantes
                  </h2>
                </div>
                {numerosSeleccionados.length > 0 && (
                  <div className="bg-purple-500/20 border border-purple-500/30 px-4 py-2 rounded-full w-fit">
                    <span className="text-purple-400 font-bold text-sm">
                      {numerosSeleccionados.length} seleccionado(s)
                    </span>
                  </div>
                )}
              </div>

              {numerosTotales.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">
                    Ingresa el número de participantes para generar los números
                  </p>
                </div>
              ) : (
                <div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ Los números seleccionados quedarán <strong>reservados</strong> y no podrán ser elegidos por usuarios
                    </p>
                  </div>
                  
                  {/* Grid de Números - Responsive */}
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-2 sm:gap-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-2">
                    <AnimatePresence>
                      {numerosTotales.map((numero) => {
                        const isSelected = numerosSeleccionados.includes(numero);
                        return (
                          <motion.button
                            key={numero}
                            type="button"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleNumero(numero)}
                            className={`relative aspect-square rounded-lg sm:rounded-xl border-2 font-bold text-base sm:text-xl transition-all ${
                              isSelected
                                ? 'bg-red-500/30 border-red-500 text-white'
                                : 'bg-white/5 border-white/10 hover:border-white/30 text-gray-300 hover:text-white'
                            }`}
                          >
                            {numero}
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Resumen de selección */}
                  {numerosSeleccionados.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                    >
                      <p className="text-white font-bold mb-2 text-sm sm:text-base">
                        Números que quedarán reservados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {numerosSeleccionados.map((num) => (
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
                        onClick={() => setNumerosSeleccionados([])}
                        className="mt-3 text-red-400 hover:text-red-300 text-sm font-bold"
                      >
                        Limpiar selección
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Tanda'
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

      {/* CSS para scrollbar */}
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