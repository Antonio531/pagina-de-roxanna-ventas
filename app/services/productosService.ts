import { supabase } from '../lib/supabase';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  imagen_url?: string; 
  stock: number;
  disponible: boolean;
  created_at: string;
}

// Obtener todos los productos
export async function getProductos(): Promise<Producto[]> {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('disponible', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
}

// Obtener un producto específico
export async function getProducto(id: string): Promise<Producto | null> {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return null;
  }
}

// Verificar stock disponible
export async function checkStock(productoId: string, cantidad: number): Promise<boolean> {
  try {
    const producto = await getProducto(productoId);
    
    if (!producto) return false;
    
    return producto.stock >= cantidad && producto.disponible;
  } catch (error) {
    console.error('Error al verificar stock:', error);
    return false;
  }
}

// ========== FUNCIONES DE ADMIN ==========

// Crear nuevo producto
export async function createProducto(data: {
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  imagen_url?: string; 
  stock: number;
}) {
  try {
    const { data: producto, error } = await supabase
      .from('productos')
      .insert([{ ...data, disponible: true }])
      .select()
      .single();

    if (error) throw error;
    return producto;
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    throw error;
  }
}

// Actualizar producto
export async function updateProducto(id: string, data: Partial<Producto>) {
  try {
    const { data: producto, error } = await supabase
      .from('productos')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return producto;
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    throw error;
  }
}

// Eliminar producto
export async function deleteProducto(id: string) {
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    throw error;
  }
}

