import { supabase } from '../lib/supabase';

export interface Orden {
  id: string;
  tipo: 'tanda' | 'productos';
  total: number;
  estado: string;
  created_at: string;
  metadata: any;
}

export interface OrdenDetalle extends Orden {
  items?: {
    producto_id: string;
    nombre: string;
    cantidad: number;
    precio: number;
  }[];
  participaciones?: {
    turno: number;
    tanda_nombre: string;
    estado: string;
  }[];
}

// Obtener órdenes del usuario
export async function getOrdenesUsuario(userId: string): Promise<OrdenDetalle[]> {
  try {
    // 1. Obtener órdenes
    const { data: ordenes, error: ordenesError } = await supabase
      .from('ordenes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordenesError) throw ordenesError;
    if (!ordenes || ordenes.length === 0) return [];

    // 2. Para cada orden, obtener detalles
    const ordenesDetalle = await Promise.all(
      ordenes.map(async (orden) => {
        if (orden.tipo === 'productos') {
          // Obtener items de productos
          const { data: items } = await supabase
            .from('orden_items')
            .select(`
              cantidad,
              precio,
              producto:productos(nombre)
            `)
            .eq('orden_id', orden.id);

          return {
            ...orden,
            items: items?.map((item: any) => ({
              producto_id: '',
              nombre:
                Array.isArray(item.producto)
                  ? (item.producto[0] as any)?.nombre
                  : (item.producto as any)?.nombre || "Producto",
              cantidad: item.cantidad,
              precio: item.precio,
            })) || [],
          };
        } else {
          // Obtener participaciones en tandas
          const tandaId = orden.metadata?.tandaId;
          const numerosSeleccionados = orden.metadata?.numerosSeleccionados?.split(',').map(Number) || [];

          const { data: tanda } = await supabase
            .from('tandas')
            .select('nombre')
            .eq('id', tandaId)
            .maybeSingle();

          return {
            ...orden,
            participaciones: numerosSeleccionados.map((turno: number) => ({
              turno,
              tanda_nombre: tanda?.nombre || 'Tanda',
              estado: 'activo',
            })),
          };
        }
      })
    );

    return ordenesDetalle;
  } catch (error: any) {
    console.error('Error al obtener órdenes:', error);
    return [];
  }
}

// Obtener participaciones activas del usuario
export async function getParticipacionesUsuario(userId: string) {
  try {
    const { data, error } = await supabase
      .from('tanda_participantes')
      .select(`
        id,
        turno,
        estado,
        fecha_ingreso,
        tanda:tandas(
          nombre,
          monto,
          frecuencia
        )
      `)
      .eq('user_id', userId)
      .order('fecha_ingreso', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error al obtener participaciones:', error);
    return [];
  }
}
