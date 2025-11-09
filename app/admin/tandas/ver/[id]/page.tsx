'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTanda, getParticipantesTanda, TandaConParticipantes, ParticipanteTanda } from '@/app/services/tandasService';
import { supabase } from '@/app/lib/supabase';
import { ArrowLeft, Users, DollarSign, Calendar, CheckCircle, Clock, XCircle, Lock, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface EstadoNumeros {
  reservados: number[];
  ocupados: { numero: number; nombre: string }[];
  disponibles: number[];
}

export default function VerTandaPage() {
  const params = useParams();
  const router = useRouter();
  const [tanda, setTanda] = useState<TandaConParticipantes | null>(null);
  const [participantes, setParticipantes] = useState<ParticipanteTanda[]>([]);
  const [estadoNumeros, setEstadoNumeros] = useState<EstadoNumeros>({
    reservados: [],
    ocupados: [],
    disponibles: []
  });
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<'grid' | 'lista'>('grid');

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const tandaId = params.id as string;
      console.log('📌 Cargando tanda:', tandaId);
      
      // Cargar datos de la tanda
      const tandaData = await getTanda(tandaId);
      const participantesData = await getParticipantesTanda(tandaId);
      
      if (!tandaData) {
        setTanda(null);
        setLoading(false);
        return;
      }
      
      // Cargar números reservados
      const { data: numerosReservados } = await supabase
        .from('numeros_reservados')
        .select('numero')
        .eq('tanda_id', tandaId)
        .order('numero', { ascending: true });
      
      // Preparar estado de números
      const reservados = numerosReservados?.map(r => r.numero) || [];
      const ocupados = participantesData.map(p => ({
        numero: p.numero_tanda,
        nombre: p.usuario.nombre
      }));
      
      // Calcular disponibles
      const todosLosNumeros = Array.from({ length: tandaData.participantes_max }, (_, i) => i + 1);
      const numerosNoDisponibles = [...reservados, ...ocupados.map(o => o.numero)];
      const disponibles = todosLosNumeros.filter(num => !numerosNoDisponibles.includes(num));
      
      setTanda(tandaData);
      setParticipantes(participantesData);
      setEstadoNumeros({ reservados, ocupados, disponibles });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoNumero = (numero: number) => {
    if (estadoNumeros.reservados.includes(numero)) return 'reservado';
    const ocupado = estadoNumeros.ocupados.find(o => o.numero === numero);
    if (ocupado) return { tipo: 'ocupado', nombre: ocupado.nombre };
    if (estadoNumeros.disponibles.includes(numero)) return 'disponible';
    return 'desconocido';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!tanda) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 text-xl mb-4">Tanda no encontrada</p>
        <Link href="/admin/tandas" className="text-purple-400 hover:text-purple-300 inline-block">
          ← Volver a Tandas
        </Link>
      </div>
    );
  }

  const totalRecaudado = participantes.reduce((sum, p) => sum + (p.monto_pagado || 0), 0);
  const participantesActivos = participantes.filter(p => p.estado === 'activo').length;
  const disponiblesReales = tanda.participantes_max - estadoNumeros.ocupados.length - estadoNumeros.reservados.length;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <Link
        href="/admin/tandas"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Tandas
      </Link>

      {/* Info de la Tanda */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl sm:text-6xl">{tanda.imagen}</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{tanda.nombre}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                <span>💰 ${tanda.monto.toLocaleString()}</span>
                <span>📅 {tanda.duracion}</span>
                <span>⚡ {tanda.frecuencia}</span>
              </div>
            </div>
          </div>
          {disponiblesReales > 0 ? (
            <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
              Disponible
            </span>
          ) : (
            <span className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-bold">
              Llena
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-xs">Inscritos</span>
            </div>
            <p className="text-xl font-bold text-white">
              {estadoNumeros.ocupados.length}/{tanda.participantes_max}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-red-400" />
              <span className="text-gray-400 text-xs">Reservados</span>
            </div>
            <p className="text-xl font-bold text-red-400">
              {estadoNumeros.reservados.length}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-xs">Disponibles</span>
            </div>
            <p className="text-xl font-bold text-green-400">
              {disponiblesReales}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-xs">Activos</span>
            </div>
            <p className="text-xl font-bold text-white">{participantesActivos}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-400 text-xs">Recaudado</span>
            </div>
            <p className="text-xl font-bold text-white">${totalRecaudado.toLocaleString()}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-pink-400" />
              <span className="text-gray-400 text-xs">Esperado</span>
            </div>
            <p className="text-xl font-bold text-white">
              ${(tanda.monto * tanda.participantes_max).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Vista */}
      <div className="flex justify-end mb-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-1 flex gap-1">
          <button
            onClick={() => setVistaActiva('grid')}
            className={`px-4 py-2 rounded-md font-semibold transition-all ${
              vistaActiva === 'grid' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Vista Grid
          </button>
          <button
            onClick={() => setVistaActiva('lista')}
            className={`px-4 py-2 rounded-md font-semibold transition-all ${
              vistaActiva === 'lista' 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Vista Lista
          </button>
        </div>
      </div>

      {/* Vista Grid de Números */}
      {vistaActiva === 'grid' && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Números de la Tanda</h2>
          
          {/* Leyenda */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/30 border border-green-500 rounded" />
              <span className="text-gray-300">Disponible ({estadoNumeros.disponibles.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500/30 border border-blue-500 rounded flex items-center justify-center">
                <User className="w-2 h-2 text-blue-400" />
              </div>
              <span className="text-gray-300">Ocupado ({estadoNumeros.ocupados.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/30 border border-red-500 rounded flex items-center justify-center">
                <Lock className="w-2 h-2 text-red-400" />
              </div>
              <span className="text-gray-300">Reservado ({estadoNumeros.reservados.length})</span>
            </div>
          </div>

          {/* Grid de números */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {Array.from({ length: tanda.participantes_max }, (_, i) => i + 1).map((numero) => {
              const estado = getEstadoNumero(numero);
              const isReservado = estado === 'reservado';
              const isOcupado = typeof estado === 'object' && estado.tipo === 'ocupado';
              const isDisponible = estado === 'disponible';

              return (
                <motion.div
                  key={numero}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: numero * 0.005 }}
                  className={`
                    relative aspect-square rounded-lg border-2 font-bold text-sm sm:text-base
                    flex items-center justify-center transition-all
                    ${isReservado 
                      ? 'bg-red-500/30 border-red-500 text-red-300' 
                      : isOcupado
                      ? 'bg-blue-500/30 border-blue-500 text-blue-300'
                      : isDisponible
                      ? 'bg-green-500/10 border-green-500/50 text-green-400'
                      : 'bg-gray-500/10 border-gray-500/50 text-gray-500'
                    }
                  `}
                  title={
                    isReservado 
                      ? `#${numero} - Reservado por administrador`
                      : isOcupado
                      ? `#${numero} - ${estado.nombre}`
                      : isDisponible
                      ? `#${numero} - Disponible`
                      : `#${numero}`
                  }
                >
                  {/* Icono según estado */}
                  {isReservado && (
                    <Lock className="w-3 h-3 absolute top-0.5 right-0.5 text-red-400" />
                  )}
                  {isOcupado && (
                    <User className="w-3 h-3 absolute top-0.5 right-0.5 text-blue-400" />
                  )}
                  
                  {/* Número */}
                  <span className="relative z-10">{numero}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista Lista de Participantes */}
      {vistaActiva === 'lista' && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Participantes</h2>
            <p className="text-gray-400 text-sm mt-1">
              Lista completa de participantes inscritos
            </p>
          </div>

          {participantes.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aún no hay participantes en esta tanda</p>
            </div>
          ) : (
            <>
              {/* Vista Desktop - Tabla */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-gray-400 font-semibold">Número</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Participante</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Email</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Teléfono</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Monto Pagado</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Fecha</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participantes.map((participante) => (
                      <tr key={participante.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">{participante.numero_tanda}</span>
                          </div>
                        </td>
                        <td className="p-4 text-white font-semibold">{participante.usuario.nombre}</td>
                        <td className="p-4 text-gray-400">{participante.usuario.email}</td>
                        <td className="p-4 text-gray-400">
                          {participante.usuario.telefono || 'Sin teléfono'}
                        </td>
                        <td className="p-4 text-white font-semibold">
                          ${(participante.monto_pagado || 0).toLocaleString()}
                        </td>
                        <td className="p-4 text-gray-400">
                          {new Date(participante.fecha_ingreso).toLocaleDateString('es-MX')}
                        </td>
                        <td className="p-4">
                          {participante.estado === 'activo' ? (
                            <span className="flex items-center gap-2 text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              Activo
                            </span>
                          ) : participante.estado === 'pendiente' ? (
                            <span className="flex items-center gap-2 text-yellow-400">
                              <Clock className="w-4 h-4" />
                              Pendiente
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-red-400">
                              <XCircle className="w-4 h-4" />
                              Inactivo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista Mobile - Cards */}
              <div className="lg:hidden p-4 space-y-3">
                {participantes.map((participante) => (
                  <div key={participante.id} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">{participante.numero_tanda}</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{participante.usuario.nombre}</p>
                          <p className="text-gray-400 text-xs">{participante.usuario.email}</p>
                        </div>
                      </div>
                      {participante.estado === 'activo' ? (
                        <span className="text-green-400 text-xs font-bold">
                          Activo
                        </span>
                      ) : (
                        <span className="text-yellow-400 text-xs font-bold">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Teléfono</p>
                        <p className="text-white">
                          {participante.usuario.telefono || 'Sin teléfono'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Fecha ingreso</p>
                        <p className="text-white">
                          {new Date(participante.fecha_ingreso).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Números Reservados (si hay) */}
          {estadoNumeros.reservados.length > 0 && (
            <div className="p-6 border-t border-white/10">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                Números Reservados por Administrador
              </h3>
              <div className="flex flex-wrap gap-2">
                {estadoNumeros.reservados.map((numero) => (
                  <span
                    key={numero}
                    className="bg-red-500/20 border border-red-500/50 px-3 py-1 rounded-lg text-red-400 font-bold"
                  >
                    #{numero}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}