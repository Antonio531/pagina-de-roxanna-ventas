'use client';

import { useEffect, useState } from 'react';
import { getProductos, deleteProducto, Producto } from '@/app/services/productosService';
import { Edit, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    setLoading(true);
    const data = await getProductos();
    setProductos(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el producto "${nombre}"?`)) return;

    setDeleting(id);
    try {
      await deleteProducto(id);
      toast.success('Producto eliminado');
      loadProductos();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Gestionar Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-gray-400 font-semibold">Emoji</th>
                <th className="text-left p-4 text-gray-400 font-semibold">Nombre</th>
                <th className="text-left p-4 text-gray-400 font-semibold">Precio</th>
                <th className="text-left p-4 text-gray-400 font-semibold">Stock</th>
                <th className="text-left p-4 text-gray-400 font-semibold">Estado</th>
                <th className="text-right p-4 text-gray-400 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-4xl">{producto.imagen}</td>
                  <td className="p-4">
                    <div className="text-white font-semibold">{producto.nombre}</div>
                    <div className="text-gray-400 text-sm">{producto.descripcion}</div>
                  </td>
                  <td className="p-4 text-white font-semibold">${producto.precio.toLocaleString()}</td>
                  <td className="p-4 text-white">{producto.stock}</td>
                  <td className="p-4">
                    {producto.disponible ? (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                        Disponible
                      </span>
                    ) : (
                      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                        No disponible
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/productos/editar/${producto.id}`}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(producto.id, producto.nombre)}
                        disabled={deleting === producto.id}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}