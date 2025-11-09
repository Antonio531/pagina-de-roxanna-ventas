'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProducto, updateProducto } from '@/app/services/productosService';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    imagen: '📱',
    disponible: true,
  });

  const emojis = ['📱', '💻', '🎧', '⌚', '📲', '🎮', '📷', '🖥️', '⌨️', '🖱️', '🎥', '📺'];

  useEffect(() => {
    loadProducto();
  }, []);

  const loadProducto = async () => {
    const producto = await getProducto(params.id as string);
    if (producto) {
      setFormData({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio.toString(),
        stock: producto.stock.toString(),
        imagen: producto.imagen,
        disponible: producto.disponible,
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProducto(params.id as string, {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio),
        stock: Number(formData.stock),
        imagen: formData.imagen,
        disponible: formData.disponible,
      });

      toast.success('Producto actualizado');
      router.push('/admin/productos');
    } catch (error: any) {
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
    <div>
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <h1 className="text-4xl font-bold text-white mb-8">Editar Producto</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
          
          {/* Nombre */}
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

          {/* Descripción */}
          <div>
            <label className="block text-white font-semibold mb-2">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 h-24"
              required
            />
          </div>

          {/* Precio */}
          <div>
            <label className="block text-white font-semibold mb-2">Precio</label>
            <input
              type="number"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-white font-semibold mb-2">Stock</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          {/* Disponible */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.disponible}
                onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-white font-semibold">Disponible</span>
            </label>
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-white font-semibold mb-2">Emoji</label>
            <div className="grid grid-cols-8 gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, imagen: emoji })}
                  className={`text-4xl p-3 rounded-xl border-2 transition-all ${
                    formData.imagen === emoji
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <Link
              href="/admin/productos"
              className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}