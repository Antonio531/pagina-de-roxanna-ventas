import { supabase } from '../lib/supabase';

// ========== TIPOS ==========
export interface Tanda {
  id: string;
  nombre: string;
  monto: number;
  participantes_max: number;
  duracion: string;
  frecuencia: string;
  imagen: string;
  color: string;
  disponible: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TandaConParticipantes extends Tanda {
  participantes_count: number;
}

export interface ParticipanteTanda {
  id: string;
  numero_tanda: number;
  estado: string;
  fecha_ingreso: string;
  monto_pagado: number;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
  };
}

// ========== OBTENER TODAS LAS TANDAS CON CONTEO ==========
export async function getTandas(): Promise<TandaConParticipantes[]> {
  try {
    console.log('🔍 Iniciando getTandas...');

    const { data: tandas, error: tandasError } = await supabase
      .from('tandas')
      .select('*')
      .order('created_at', { ascending: false });

    if (tandasError) {
      console.error('❌ Error obteniendo tandas:', tandasError);
      throw tandasError;
    }

    if (!tandas || tandas.length === 0) {
      console.log('⚠️ No hay tandas');
      return [];
    }

    console.log(`✅ ${tandas.length} tandas encontradas`);

    const { data: todosParticipantes, error: participantesError } = await supabase
      .from('tanda_participantes')
      .select('tanda_id');

    if (participantesError) {
      console.error('❌ Error obteniendo participantes:', participantesError);
    }

    console.log('👥 Total participantes en BD:', todosParticipantes?.length || 0);

    const tandasConConteo = tandas.map(tanda => {
      const count = todosParticipantes?.filter(p => p.tanda_id === tanda.id).length || 0;
      console.log(`  📊 ${tanda.nombre}: ${count} participantes`);
      
      return {
        ...tanda,
        participantes_count: count,
      };
    });

    return tandasConConteo;
  } catch (error: any) {
    console.error('💥 Error en getTandas:', error);
    return [];
  }
}

// ========== OBTENER UNA TANDA POR ID ==========
export async function getTanda(id: string): Promise<TandaConParticipantes | null> {
  try {
    const { data, error } = await supabase
      .from('tandas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const { count } = await supabase
      .from('tanda_participantes')
      .select('*', { count: 'exact', head: true })
      .eq('tanda_id', id);

    return {
      ...data,
      participantes_count: count || 0,
    };
  } catch (error: any) {
    console.error('Error al obtener tanda:', error);
    return null;
  }
}

// ========== OBTENER PARTICIPANTES DE UNA TANDA ==========
export async function getParticipantesTanda(tandaId: string): Promise<ParticipanteTanda[]> {
  try {
    console.log('🔍 === INICIO getParticipantesTanda ===');
    console.log('🔍 TandaID:', tandaId);

    const { data: participantesData, error: participantesError } = await supabase
      .from('tanda_participantes')
      .select('*')
      .eq('tanda_id', tandaId)
      .order('turno', { ascending: true });

    console.log('📊 Participantes data:', participantesData);
    console.log('❌ Error:', participantesError);

    if (participantesError) {
      console.error('Error en participantes:', participantesError);
      throw participantesError;
    }

    if (!participantesData || participantesData.length === 0) {
      console.log('⚠️ No hay participantes');
      return [];
    }

    console.log(`✅ Encontrados ${participantesData.length} participantes`);

    const userIds = participantesData.map(p => p.user_id);
    console.log('👥 User IDs:', userIds);

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, nombre, email, telefono')
      .in('id', userIds);

    console.log('👤 Users data:', usersData);

    if (usersError) {
      console.error('Error en users:', usersError);
    }

    const participantes = participantesData.map(p => {
      const usuario = usersData?.find(u => u.id === p.user_id);
      
      return {
        id: p.id,
        numero_tanda: p.turno,
        estado: p.estado,
        fecha_ingreso: p.fecha_ingreso,
        monto_pagado: 0,
        usuario: {
          id: usuario?.id || '',
          nombre: usuario?.nombre || 'Usuario desconocido',
          email: usuario?.email || 'N/A',
          telefono: usuario?.telefono || 'N/A',
        }
      };
    });

    console.log('✅ Participantes finales:', participantes);
    return participantes;
  } catch (error: any) {
    console.error('💥 Error al obtener participantes:', error);
    return [];
  }
}

// ========== VERIFICAR SI USUARIO ESTÁ EN TANDA ==========
export async function isUserInTanda(tandaId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('tanda_participantes')
      .select('id')
      .eq('tanda_id', tandaId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error: any) {
    console.error('Error verificando usuario en tanda:', error);
    return false;
  }
}

// ========== UNIRSE A UNA TANDA ==========
export async function joinTanda(tandaId: string, userId: string): Promise<void> {
  try {
    const alreadyIn = await isUserInTanda(tandaId, userId);
    if (alreadyIn) {
      throw new Error('Ya estás inscrito en esta tanda');
    }

    const { data: participantes } = await supabase
      .from('tanda_participantes')
      .select('turno')
      .eq('tanda_id', tandaId);

    const numerosOcupados = participantes?.map(p => p.turno) || [];

    const { data: tanda } = await supabase
      .from('tandas')
      .select('participantes_max')
      .eq('id', tandaId)
      .single();

    if (!tanda) throw new Error('Tanda no encontrada');

    let numeroDisponible = 1;
    for (let i = 1; i <= tanda.participantes_max; i++) {
      if (!numerosOcupados.includes(i)) {
        numeroDisponible = i;
        break;
      }
    }

    const { error } = await supabase
      .from('tanda_participantes')
      .insert([{
        tanda_id: tandaId,
        user_id: userId,
        turno: numeroDisponible,
        estado: 'activo',
        fecha_ingreso: new Date().toISOString(),
      }]);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error al unirse a tanda:', error);
    throw error;
  }
}

// ========== ADMIN: CREAR TANDA ==========
export async function createTanda(data: {
  nombre: string;
  monto: number;
  participantes_max: number;
  duracion: string;
  frecuencia: string;
  imagen: string;
  color: string;
}) {
  try {
    console.log('📝 Creando tanda en BD...', data);
    
    const { data: tanda, error } = await supabase
      .from('tandas')
      .insert([{ 
        ...data, 
        disponible: true
        // ⭐ REMOVIDO: participantes_count no existe en la BD
      }])
      .select() // Devuelve la tanda creada
      .single();

    if (error) {
      console.error('❌ Error en createTanda:', error);
      console.error('❌ Detalles del error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { tanda: null, error };
    }

    console.log('✅ Tanda creada exitosamente:', tanda);
    
    // Agregar el conteo inicial (será 0 porque es nueva)
    const tandaConConteo = {
      ...tanda,
      participantes_count: 0
    };
    
    return { tanda: tandaConConteo, error: null };
  } catch (error: any) {
    console.error('💥 Error al crear tanda:', error);
    return { tanda: null, error };
  }
}

// ========== ADMIN: ACTUALIZAR TANDA ==========
export async function updateTanda(id: string, data: Partial<Tanda>) {
  try {
    // Asegurarnos de no enviar participantes_count a la BD
    const { participantes_count, ...dataToUpdate } = data as any;
    
    const { data: tanda, error } = await supabase
      .from('tandas')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return tanda;
  } catch (error: any) {
    console.error('Error al actualizar tanda:', error);
    throw error;
  }
}

// ========== ADMIN: ELIMINAR TANDA ==========
export async function deleteTanda(id: string) {
  try {
    const { error } = await supabase
      .from('tandas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error al eliminar tanda:', error);
    throw error;
  }
}

// ========== MIS TANDAS (USUARIO) ==========
export async function getMisTandas(userId: string): Promise<TandaConParticipantes[]> {
  try {
    console.log('🔍 Obteniendo tandas del usuario:', userId);

    // Obtener las tandas donde participa el usuario
    const { data: participaciones, error: participacionesError } = await supabase
      .from('tanda_participantes')
      .select('tanda_id, turno, estado, fecha_ingreso')
      .eq('user_id', userId)
      .order('fecha_ingreso', { ascending: false });

    if (participacionesError) {
      console.error('❌ Error obteniendo participaciones:', participacionesError);
      return [];
    }

    if (!participaciones || participaciones.length === 0) {
      console.log('⚠️ El usuario no participa en ninguna tanda');
      return [];
    }

    // Obtener los IDs de las tandas
    const tandaIds = participaciones.map(p => p.tanda_id);

    // Obtener información de las tandas
    const { data: tandas, error: tandasError } = await supabase
      .from('tandas')
      .select('*')
      .in('id', tandaIds);

    if (tandasError) {
      console.error('❌ Error obteniendo tandas:', tandasError);
      return [];
    }

    // Obtener conteo de participantes para cada tanda
    const { data: todosParticipantes } = await supabase
      .from('tanda_participantes')
      .select('tanda_id')
      .in('tanda_id', tandaIds);

    // Combinar la información
    const tandasConInfo = tandas?.map(tanda => {
      const participacion = participaciones.find(p => p.tanda_id === tanda.id);
      const count = todosParticipantes?.filter(p => p.tanda_id === tanda.id).length || 0;
      
      return {
        ...tanda,
        participantes_count: count,
        mi_turno: participacion?.turno,
        mi_estado: participacion?.estado,
        fecha_ingreso: participacion?.fecha_ingreso
      };
    }) || [];

    console.log(`✅ ${tandasConInfo.length} tandas encontradas para el usuario`);
    return tandasConInfo;
  } catch (error: any) {
    console.error('💥 Error en getMisTandas:', error);
    return [];
  }
}


// ========== FUNCIÓN PARA OBTENER NÚMEROS RESERVADOS ==========
// Agregar esta función a tu archivo tandasService.ts existente

export async function getNumerosReservados(tandaId: string): Promise<number[]> {
  try {
    console.log('🔍 Obteniendo números reservados para tanda:', tandaId);
    
    const { data, error } = await supabase
      .from('numeros_reservados')
      .select('numero')
      .eq('tanda_id', tandaId)
      .order('numero', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo números reservados:', error);
      return [];
    }

    const numeros = data?.map(item => item.numero) || [];
    console.log(`✅ ${numeros.length} números reservados:`, numeros);
    
    return numeros;
  } catch (error: any) {
    console.error('💥 Error en getNumerosReservados:', error);
    return [];
  }
}

// ========== OBTENER NÚMEROS DISPONIBLES Y OCUPADOS ==========
export async function getEstadoNumeros(tandaId: string): Promise<{
  reservados: number[];
  ocupados: { numero: number; nombre: string }[];
  disponibles: number[];
}> {
  try {
    // Obtener info de la tanda
    const { data: tanda } = await supabase
      .from('tandas')
      .select('participantes_max')
      .eq('id', tandaId)
      .single();

    if (!tanda) throw new Error('Tanda no encontrada');

    // Obtener números reservados
    const { data: reservados } = await supabase
      .from('numeros_reservados')
      .select('numero')
      .eq('tanda_id', tandaId);

    // Obtener participantes (números ocupados)
    const { data: participantes } = await supabase
      .from('tanda_participantes')
      .select(`
        turno,
        users!inner(nombre)
      `)
      .eq('tanda_id', tandaId);

    const numerosReservados = reservados?.map(r => r.numero) || [];
    const numerosOcupados = participantes?.map(p => ({
      numero: p.turno,
      nombre: p.users?.nombre || 'Usuario'
    })) || [];

    // Calcular disponibles
    const todosLosNumeros = Array.from({ length: tanda.participantes_max }, (_, i) => i + 1);
    const numerosNoDisponibles = [
      ...numerosReservados,
      ...numerosOcupados.map(o => o.numero)
    ];
    
    const numerosDisponibles = todosLosNumeros.filter(
      num => !numerosNoDisponibles.includes(num)
    );

    return {
      reservados: numerosReservados,
      ocupados: numerosOcupados,
      disponibles: numerosDisponibles
    };
  } catch (error: any) {
    console.error('💥 Error en getEstadoNumeros:', error);
    return {
      reservados: [],
      ocupados: [],
      disponibles: []
    };
  }
}