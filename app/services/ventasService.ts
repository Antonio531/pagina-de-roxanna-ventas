import { supabase } from '../lib/supabase';

export interface VentaDetalle {
  id: string;
  orden_id: string;
  user_id: string;
  total: number;
  estado: string;
  created_at: string;
  usuario: {
    nombre: string;
    email: string;
    telefono?: string;
  };
  items: {
    producto_id: string;
    nombre: string;
    cantidad: number;
    precio: number;
  }[];
  direccion_envio: {
    nombre_completo: string;
    telefono: string;
    calle: string;
    numero_exterior: string;
    numero_interior?: string;
    colonia: string;
    ciudad: string;
    estado: string;
    codigo_postal: string;
    referencias?: string;
  } | null;
}

export async function getVentasProductos(): Promise<VentaDetalle[]> {
  try {
    console.log('🔍 Iniciando carga de ventas...');

    const { data: ordenes, error: ordenesError } = await supabase
      .from('ordenes')
      .select('*')
      .eq('tipo', 'productos')
      .order('created_at', { ascending: false });

    if (ordenesError) {
      console.error('❌ Error obteniendo órdenes:', ordenesError);
      throw ordenesError;
    }

    if (!ordenes || ordenes.length === 0) {
      console.log('⚠️ No hay órdenes');
      return [];
    }

    console.log('✅ Órdenes obtenidas:', ordenes.length);

    const ventasDetalle = await Promise.all(
      ordenes.map(async (orden, index) => {
        console.log(`\n🔸 Procesando orden ${index + 1}/${ordenes.length}: ${orden.id}`);
        console.log('📋 Metadata completa:', orden.metadata);

        // Obtener usuario
        const { data: usuarioData, error: usuarioError } = await supabase
          .from('users')
          .select('nombre, email, telefono')
          .eq('id', orden.user_id)
          .maybeSingle();

        console.log('👤 Usuario:', usuarioData?.nombre || 'No encontrado');

        // Obtener items
        const { data: ordenItems, error: itemsError } = await supabase
          .from('orden_items')
          .select('cantidad, precio, producto_id')
          .eq('orden_id', orden.id);

        console.log('📦 Items obtenidos:', ordenItems?.length || 0);

        // Obtener nombres de productos
        let items: { producto_id: string; nombre: string; cantidad: number; precio: number }[] = [];
        if (ordenItems && ordenItems.length > 0) {
          items = await Promise.all(
            ordenItems.map(async (item) => {
              const { data: producto } = await supabase
                .from('productos')
                .select('nombre')
                .eq('id', item.producto_id)
                .maybeSingle();
                

              return {
                producto_id: item.producto_id,
                nombre: producto?.nombre || 'Producto',
                cantidad: item.cantidad,
                precio: item.precio,
              };
            })
          );
        }

        // ⭐ OBTENER DIRECCIÓN - CON LOGS DETALLADOS
        let direccion_envio = null;

        console.log('🔍 Buscando dirección para orden:', orden.id);
        console.log('📋 Metadata completo:', JSON.stringify(orden.metadata, null, 2));

        // Opción 1: Desde metadata
        if (orden.metadata?.direccion_envio) {
          try {
            const rawDireccion = orden.metadata.direccion_envio;
            console.log('📋 Tipo de direccion_envio:', typeof rawDireccion);
            console.log('📋 Valor raw:', rawDireccion);

            // Intentar parsear si es string
            if (typeof rawDireccion === 'string') {
              try {
                direccion_envio = JSON.parse(rawDireccion);
                console.log('✅ Dirección parseada desde STRING');
              } catch (parseError) {
                console.error('❌ Error parseando JSON:', parseError);
                // Si falla el parse, intentar como está
                direccion_envio = rawDireccion;
              }
            } else if (typeof rawDireccion === 'object' && rawDireccion !== null) {
              // Ya es un objeto
              direccion_envio = rawDireccion;
              console.log('✅ Dirección ya es un OBJETO');
            }

            console.log('📍 Dirección final desde metadata:', JSON.stringify(direccion_envio, null, 2));
          } catch (e) {
            console.error('❌ Error general procesando dirección:', e);
          }
        } else {
          console.log('⚠️ No hay direccion_envio en metadata');
        }

        // Opción 2: Desde tabla direcciones_envio
        if (!direccion_envio) {
          console.log('🔍 Buscando en tabla direcciones_envio para user_id:', orden.user_id);

          const { data: direccionData, error: direccionError } = await supabase
            .from('direcciones_envio')
            .select('*')
            .eq('user_id', orden.user_id)
            .eq('es_principal', true)
            .maybeSingle();

          if (direccionError) {
            console.log('⚠️ Error buscando dirección:', direccionError.message);
          }

          if (direccionData) {
            direccion_envio = {
              nombre_completo: direccionData.nombre_completo,
              telefono: direccionData.telefono,
              calle: direccionData.calle,
              numero_exterior: direccionData.numero_exterior,
              numero_interior: direccionData.numero_interior,
              colonia: direccionData.colonia,
              ciudad: direccionData.ciudad,
              estado: direccionData.estado,
              codigo_postal: direccionData.codigo_postal,
              referencias: direccionData.referencias,
            };
            console.log('✅ Dirección obtenida desde tabla direcciones_envio');
            console.log('📍 Dirección:', direccion_envio);
          } else {
            console.log('⚠️ No se encontró dirección en tabla para user_id:', orden.user_id);
          }
        }

        if (!direccion_envio) {
          console.log('❌ NO HAY DIRECCIÓN PARA ESTA ORDEN');
        }

        return {
          id: orden.id,
          orden_id: orden.id,
          user_id: orden.user_id,
          total: orden.total,
          estado: orden.estado,
          created_at: orden.created_at,
          usuario: usuarioData || {
            nombre: 'Usuario Desconocido',
            email: 'N/A',
            telefono: 'N/A',
          },
          items: items,
          direccion_envio: direccion_envio,
        };
      })
    );

    console.log('\n✅ RESUMEN FINAL:');
    console.log('Total ventas:', ventasDetalle.length);
    console.log('Ventas con dirección:', ventasDetalle.filter(v => v.direccion_envio).length);
    console.log('Ventas SIN dirección:', ventasDetalle.filter(v => !v.direccion_envio).length);

    return ventasDetalle;
  } catch (error: any) {
    console.error('💥 Error al obtener ventas:', error);
    return [];
  }
}
