'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Users, Clock, CheckCircle, XCircle, Zap } from 'lucide-react';
import { getTanda, joinTanda, isUserInTanda } from '@/app/services/tandasService';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import toast from 'react-hot-toast';
import { TandaConParticipantes } from '@/app/services/tandasService';

interface NumeroTanda {
  numero: number;
  ocupado: boolean;
  fecha: Date;
  usuario?: string;
}

export default function TandaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [tanda, setTanda] = useState<TandaConParticipantes | null>(null);
  const [numeros, setNumeros] = useState<NumeroTanda[]>([]);
  const [selectedNumeros, setSelectedNumeros] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadTandaDetail();
  }, [params.id]);

  const loadTandaDetail = async () => {
    setLoading(true);
    try {
      const tandaId = params.id as string;
      
      // Cargar datos de la tanda
      const tandaData = await getTanda(tandaId);
      
      if (tandaData) {
        setTanda(tandaData);
        
        // Cargar números RESERVADOS por admin
        const { data: reservados } = await supabase
          .from('numeros_reservados')
          .select('numero')
          .eq('tanda_id', tandaId);
        
        const numerosReservadosArray = reservados?.map(r => r.numero) || [];
        
        // Cargar números OCUPADOS por participantes
        const { data: participantes } = await supabase
          .from('tanda_participantes')
          .select('turno')
          .eq('tanda_id', tandaId);
        
        const numerosOcupadosArray = participantes?.map(p => p.turno) || [];
        
        // ⭐ COMBINAR reservados y ocupados - todos se ven igual
        const todosOcupados = [...numerosReservadosArray, ...numerosOcupadosArray];
        
        // Generar los números
        generateNumeros(tandaData, todosOcupados);
      }
    } catch (error) {
      console.error('Error cargando tanda:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNumeros = (tandaData: TandaConParticipantes, ocupados: number[]) => {
    const fechaInicio = new Date();
    const numerosArray: NumeroTanda[] = [];
    
    for (let i = 1; i <= tandaData.participantes_max; i++) {
      const fecha = calcularFechaCobro(fechaInicio, i, tandaData.frecuencia);
      
      numerosArray.push({
        numero: i,
        ocupado: ocupados.includes(i), // ⭐ Simplemente marca como ocupado
        fecha: fecha,
      });
    }
    
    setNumeros(numerosArray);
  };

  const calcularFechaCobro = (fechaInicio: Date, numeroTurno: number, frecuencia: string): Date => {
    const fecha = new Date(fechaInicio);
    
    switch (frecuencia.toLowerCase()) {
      case 'semanal':
        fecha.setDate(fecha.getDate() + (numeroTurno - 1) * 7);
        break;
      case 'quincenal':
        fecha.setDate(fecha.getDate() + (numeroTurno - 1) * 15);
        break;
      case 'mensual':
        fecha.setMonth(fecha.getMonth() + (numeroTurno - 1));
        break;
    }
    
    return fecha;
  };

  const toggleNumero = (numero: number, ocupado: boolean) => {
    if (ocupado) {
      toast.error('Este número ya está ocupado');
      return;
    }
    
    if (selectedNumeros.includes(numero)) {
      setSelectedNumeros(selectedNumeros.filter(n => n !== numero));
    } else {
      setSelectedNumeros([...selectedNumeros, numero]);
    }
  };

  const handleJoinTanda = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Debes iniciar sesión');
      router.push('/login');
      return;
    }

    if (!tanda) {
      toast.error('Error al cargar la tanda');
      return;
    }

    if (selectedNumeros.length === 0) {
      toast.error('Selecciona al menos un número');
      return;
    }

    setJoining(true);

    try {
      const montoTotal = tanda.monto * selectedNumeros.length;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'tanda',
          userId: user.id,
          metadata: {
            tandaId: params.id,
            tandaNombre: tanda.nombre,
            numerosSeleccionados: selectedNumeros.join(','),
            montoTotal: montoTotal.toString(),
          },
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.url) {
        throw new Error('No se recibió URL de pago');
      }

      window.location.href = data.url;

    } catch (error: any) {
      console.error('❌ Error:', error);
      toast.error(error.message || 'Error al procesar el pago');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!tanda) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Tanda no encontrada</h2>
          <button
            onClick={() => router.push('/')}
            className="text-purple-400 hover:text-purple-300"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const fechaInicio = new Date();
  const ultimaFecha = calcularFechaCobro(fechaInicio, tanda.participantes_max, tanda.frecuencia);
  
  // Contar todos los ocupados
  const totalOcupados = numeros.filter(n => n.ocupado).length;
  const disponiblesReales = tanda.participantes_max - totalOcupados;

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-6xl">{tanda.imagen}</div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{tanda.nombre}</h1>
                <div className={`text-4xl font-black bg-gradient-to-r ${tanda.color} text-transparent bg-clip-text`}>
                  ${tanda.monto.toLocaleString()}
                </div>
              </div>
            </div>
            
            {disponiblesReales > 0 ? (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                {disponiblesReales} disponibles
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-full text-sm font-bold">
                Llena
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 text-gray-300">
              <div className={`w-12 h-12 bg-gradient-to-br ${tanda.color} rounded-xl flex items-center justify-center`}>
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Duración</div>
                <div className="font-semibold">{tanda.duracion}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-300">
              <div className={`w-12 h-12 bg-gradient-to-br ${tanda.color} rounded-xl flex items-center justify-center`}>
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Frecuencia</div>
                <div className="font-semibold">{tanda.frecuencia}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-300">
              <div className={`w-12 h-12 bg-gradient-to-br ${tanda.color} rounded-xl flex items-center justify-center`}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Participantes</div>
                <div className="font-semibold">{totalOcupados}/{tanda.participantes_max}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Inicio: {fechaInicio.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="mx-2">→</span>
              <span>Fin: {ultimaFecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            Selecciona tus números
            {selectedNumeros.length > 0 && (
              <span className="text-purple-400 ml-3">({selectedNumeros.length} seleccionados)</span>
            )}
          </h2>
          
          {/* Leyenda simple */}
          <div className="flex flex-wrap gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/5 border-2 border-white/10 rounded"></div>
              <span className="text-gray-400">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500/10 border-2 border-red-500/30 rounded flex items-center justify-center">
                <XCircle className="w-3 h-3 text-red-400" />
              </div>
              <span className="text-gray-400">Ocupado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 bg-gradient-to-br ${tanda.color} rounded flex items-center justify-center`}>
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-400">Reservado</span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 mb-8">
            {numeros.map((num) => (
              <motion.button
                key={num.numero}
                whileHover={{ scale: num.ocupado ? 1 : 1.05 }}
                whileTap={{ scale: num.ocupado ? 1 : 0.95 }}
                onClick={() => toggleNumero(num.numero, num.ocupado)}
                disabled={num.ocupado}
                className={`
                  aspect-square rounded-xl font-bold text-lg transition-all relative
                  ${num.ocupado 
                    ? 'bg-red-500/10 border-2 border-red-500/30 text-red-400 cursor-not-allowed' 
                    : selectedNumeros.includes(num.numero)
                      ? `bg-gradient-to-br ${tanda.color} text-white border-2 border-transparent shadow-lg`
                      : 'bg-white/5 border-2 border-white/10 text-white hover:border-purple-500/50'
                  }
                `}
              >
                {num.numero}
                {num.ocupado && (
                  <XCircle className="absolute top-1 right-1 w-4 h-4" />
                )}
                {selectedNumeros.includes(num.numero) && !num.ocupado && (
                  <CheckCircle className="absolute top-1 right-1 w-4 h-4" />
                )}
              </motion.button>
            ))}
          </div>

          {selectedNumeros.length > 0 && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-4">Fechas de cobro:</h3>
              <div className="space-y-2">
                {selectedNumeros.sort((a, b) => a - b).map((num) => {
                  const numeroData = numeros.find(n => n.numero === num);
                  return (
                    <div key={num} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">Número {num}:</span>
                      <span className="text-purple-400 font-semibold">
                        {numeroData?.fecha.toLocaleDateString('es-MX', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white/5 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Números seleccionados:</span>
              <span className="text-white font-bold text-xl">{selectedNumeros.length}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Pago por número:</span>
              <span className="text-white font-bold text-xl">${tanda.monto.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-white font-semibold text-lg">Total a pagar:</span>
              <span className="text-white font-black text-3xl">
                ${(tanda.monto * selectedNumeros.length).toLocaleString()}
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoinTanda}
            disabled={selectedNumeros.length === 0 || joining}
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
              ${selectedNumeros.length > 0 && !joining
                ? `bg-gradient-to-r ${tanda.color} text-white hover:shadow-lg`
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {joining ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Confirmar y Unirse
                <CheckCircle className="w-6 h-6" />
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}