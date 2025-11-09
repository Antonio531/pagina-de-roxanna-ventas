'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  Truck,
  DollarSign,
  Upload,
  CheckCircle,
  XCircle,
  ImagePlus,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Producto {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  imagen_url: string;
  stock: number;
  disponible: boolean;
  envio_gratis: boolean;
  precio_envio: number;
}

export default function ProductosAdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagenesTemp, setImagenesTemp] = useState<string[]>([]);
  const [formData, setFormData] = useState<Producto>({
    nombre: '',
    descripcion: '',
    precio: 0,
    imagen: '📦',
    imagen_url: '',
    stock: 0,
    disponible: true,
    envio_gratis: true,
    precio_envio: 0,
  });

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  const parseImagenes = (imagen_url: string): string[] => {
    if (!imagen_url) return [];
    try {
      const parsed = JSON.parse(imagen_url);
      return Array.isArray(parsed) ? parsed : [imagen_url];
    } catch {
      return imagen_url ? [imagen_url] : [];
    }
  };

  const uploadImages = async (files: FileList) => {
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} no es una imagen`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} es muy grande (máx 5MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
          .from('productos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('productos')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setImagenesTemp([...imagenesTemp, ...uploadedUrls]);
      toast.success(`✅ ${uploadedUrls.length} imagen(es) subida(s)`);
    } catch (error: any) {
      console.error('Error subiendo imágenes:', error);
      toast.error('Error subiendo imágenes');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = async (imageUrl: string, index: number) => {
    try {
      const fileName = imageUrl.split('/').pop();
      
      if (fileName) {
        const { error } = await supabase.storage
          .from('productos')
          .remove([fileName]);

        if (error) console.error('Error eliminando de storage:', error);
      }

      const newImagenes = imagenesTemp.filter((_, i) => i !== index);
      setImagenesTemp(newImagenes);
      
      toast.success('🗑️ Imagen eliminada');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error eliminando imagen');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (imagenesTemp.length === 0) {
        toast.error('Debes agregar al menos una imagen');
        return;
      }

      const productoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: formData.precio,
        imagen: formData.imagen,
        imagen_url: JSON.stringify(imagenesTemp),
        stock: formData.stock,
        disponible: formData.disponible,
        envio_gratis: formData.envio_gratis,
        precio_envio: formData.envio_gratis ? 0 : formData.precio_envio,
      };

      if (editingProducto) {
        const { error } = await supabase
          .from('productos')
          .update({
            ...productoData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProducto.id);

        if (error) throw error;
        toast.success('✅ Producto actualizado');
      } else {
        const { error } = await supabase
          .from('productos')
          .insert([productoData]);

        if (error) throw error;
        toast.success('✅ Producto creado');
      }

      loadProductos();
      closeModal();
    } catch (error: any) {
      console.error('Error guardando producto:', error);
      toast.error(error?.message || 'Error guardando producto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;

    try {
      const producto = productos.find(p => p.id === id);
      
      if (producto?.imagen_url) {
        const imagenes = parseImagenes(producto.imagen_url);
        if (imagenes.length > 0) {
          const fileNames = imagenes.map(url => url.split('/').pop()).filter(Boolean);
          if (fileNames.length > 0) {
            await supabase.storage
              .from('productos')
              .remove(fileNames as string[]);
          }
        }
      }

      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('🗑️ Producto eliminado');
      loadProductos();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error eliminando producto');
    }
  };

  const openModal = (producto?: Producto) => {
    if (producto) {
      setEditingProducto(producto);
      setFormData(producto);
      setImagenesTemp(parseImagenes(producto.imagen_url));
    } else {
      setEditingProducto(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: 0,
        imagen: '📦',
        imagen_url: '',
        stock: 0,
        disponible: true,
        envio_gratis: true,
        precio_envio: 0,
      });
      setImagenesTemp([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProducto(null);
    setImagenesTemp([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Gestión de Productos</h1>
            <p className="text-gray-400">Administra tu inventario</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </motion.button>
        </div>

        {/* Tabla de Productos */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Imágenes</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Precio</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Envío</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {productos.map((producto) => {
                    const imagenes = parseImagenes(producto.imagen_url);
                    return (
                      <tr key={producto.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {imagenes.length > 0 ? (
                              <>
                                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={imagenes[0]} 
                                    alt={producto.nombre} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                {imagenes.length > 1 && (
                                  <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      +{imagenes.length - 1}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                                <span className="text-3xl">{producto.imagen}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{producto.nombre}</div>
                          <div className="text-sm text-gray-400 line-clamp-1">{producto.descripcion}</div>
                        </td>
                        <td className="px-6 py-4 text-white font-bold">${producto.precio?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-white">{producto.stock} unidades</td>
                        <td className="px-6 py-4">
                          {producto.envio_gratis ? (
                            <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                              <Truck className="w-3 h-3" />
                              Gratis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                              <DollarSign className="w-3 h-3" />
                              ${producto.precio_envio}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {producto.disponible ? (
                            <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                              <CheckCircle className="w-3 h-3" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                              <XCircle className="w-3 h-3" />
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(producto)}
                              className="p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(producto.id!)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre */}
                <div>
                  <label className="block text-white font-bold mb-2">Nombre del Producto</label>
                  <input
                    type="text"
                    value={formData.nombre || ''}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-white font-bold mb-2">Descripción</label>
                  <textarea
                    value={formData.descripcion || ''}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                {/* Precio y Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-bold mb-2">Precio</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.precio || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          precio: e.target.value === '' ? 0 : parseFloat(e.target.value) 
                        })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-bold mb-2">Stock</label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.stock || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          stock: e.target.value === '' ? 0 : parseInt(e.target.value) 
                        })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Subir Imágenes */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                  <label className="flex items-center gap-2 text-white font-bold">
                    <ImagePlus className="w-5 h-5 text-purple-400" />
                    Imágenes del Producto
                  </label>

                  <div>
                    <label className="block w-full cursor-pointer">
                      <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-500 hover:bg-white/5 transition-all">
                        {uploadingImages ? (
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                            <p className="text-white font-bold">Subiendo imágenes...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <Upload className="w-10 h-10 text-gray-400" />
                            <p className="text-white font-bold">Click para subir imágenes</p>
                            <p className="text-gray-400 text-sm">PNG, JPG, WEBP (máx 5MB cada una)</p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            uploadImages(e.target.files);
                          }
                        }}
                        className="hidden"
                        disabled={uploadingImages}
                      />
                    </label>
                  </div>

                  {imagenesTemp.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {imagenesTemp.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(url, index)}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Configuración de Envío */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                  <label className="flex items-center gap-2 text-white font-bold">
                    <Truck className="w-5 h-5 text-purple-400" />
                    Configuración de Envío
                  </label>

                  <div>
                    <select
                      value={formData.envio_gratis ? 'gratis' : 'costo'}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        envio_gratis: e.target.value === 'gratis',
                        precio_envio: e.target.value === 'gratis' ? 0 : formData.precio_envio
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="gratis" className="bg-slate-900">Envío Gratis</option>
                      <option value="costo" className="bg-slate-900">Envío con Costo</option>
                    </select>
                  </div>

                  <AnimatePresence>
                    {!formData.envio_gratis && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-gray-400 text-sm mb-2">Precio del Envío</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            value={formData.precio_envio || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              precio_envio: e.target.value === '' ? 0 : parseFloat(e.target.value)
                            })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Imagen Emoji */}
                <div>
                  <label className="block text-white font-bold mb-2">Emoji del Producto (Fallback)</label>
                  <input
                    type="text"
                    value={formData.imagen || ''}
                    onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="📦"
                    maxLength={2}
                  />
                </div>

                {/* Disponible */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="disponible"
                    checked={formData.disponible}
                    onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-2 focus:ring-purple-500"
                  />
                  <label htmlFor="disponible" className="text-white font-bold">
                    Producto Disponible
                  </label>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    {editingProducto ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}