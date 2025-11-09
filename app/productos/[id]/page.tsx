'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Package, 
  Shield, 
  Truck,
  Heart,
  Share2,
  CheckCircle,
  XCircle,
  Star,
  Zap,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { useCart } from '@/app/context/CartContext';
import { useAuth } from '@/app/context/AuthContext';
import toast from 'react-hot-toast';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  imagen_url?: string;
  stock: number;
  disponible: boolean;
  envio_gratis?: boolean;
  precio_envio?: number;
}

export default function ProductoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
  const [comprando, setComprando] = useState(false); // ⭐ Estado para loading

  useEffect(() => {
    loadProducto();
  }, [params.id]);

  // Parsear imágenes desde JSON
  const parseImagenes = (imagen_url: string): string[] => {
    if (!imagen_url) return [];
    try {
      const parsed = JSON.parse(imagen_url);
      return Array.isArray(parsed) ? parsed : [imagen_url];
    } catch {
      return imagen_url ? [imagen_url] : [];
    }
  };

  const loadProducto = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setProducto(data);
      
      // Parsear y establecer imágenes
      const imgs = parseImagenes(data.imagen_url);
      setImagenes(imgs);
    } catch (error) {
      console.error('Error cargando producto:', error);
      toast.error('Producto no encontrado');
      router.push('/productos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión');
      router.push('/login');
      return;
    }

    if (!producto || producto.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    if (cantidad > producto.stock) {
      toast.error(`Solo hay ${producto.stock} unidades disponibles`);
      return;
    }

    addToCart({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      quantity: cantidad,
    });

    toast.success(`${cantidad}x ${producto.nombre} agregado al carrito 🛒`);
  };

  // 💳 Comprar ahora → guarda producto temporal y redirige a /envio
  const handleComprarAhora = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para continuar');
      router.push('/login');
      return;
    }

    if (!producto || producto.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    if (cantidad > producto.stock) {
      toast.error(`Solo hay ${cantidad} unidades disponibles`);
      return;
    }

    // Mostrar animación y mensaje de compra
    setComprando(true);
    toast.success(`Preparando tu compra de ${cantidad}x ${producto.nombre} 💳`);

    // Crear carrito temporal con el producto y la cantidad seleccionada
    const productoCompra = [
      {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        quantity: cantidad, // ⭐ Usar la cantidad seleccionada
      },
    ];

    // Guardar en localStorage para que /envio lo lea
    localStorage.setItem('cart', JSON.stringify(productoCompra));

    // Esperar un breve momento para UX
    await new Promise((res) => setTimeout(res, 1200));

    // Redirigir a /envio
    router.push('/envio');
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión');
      router.push('/login');
      return;
    }

    setIsFavorite(!isFavorite);
    
    if (!isFavorite) {
      toast.success('❤️ Agregado a favoritos');
    } else {
      toast.success('Removido de favoritos');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `¡Mira este producto! ${producto?.nombre}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: producto?.nombre,
          text: text,
          url: url,
        });
        toast.success('¡Compartido!');
      } catch (err) {
        console.log('Error compartiendo:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('¡Link copiado al portapapeles!');
      } catch (err) {
        toast.error('No se pudo copiar el link');
      }
    }
  };

  const nextImage = () => {
    setImagenSeleccionada((prev) => (prev + 1) % imagenes.length);
  };

  const prevImage = () => {
    setImagenSeleccionada((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!producto) return null;

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a productos
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna Izquierda - Galería de Imágenes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Imagen Principal */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 aspect-square flex items-center justify-center relative overflow-hidden">
              {imagenes.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={imagenSeleccionada}
                      src={imagenes[imagenSeleccionada]}
                      alt={producto.nombre}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                      className="max-w-full max-h-full object-contain rounded-xl"
                    />
                  </AnimatePresence>

                  {/* Flechas de navegación - Solo si hay más de 1 imagen */}
                  {imagenes.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      {/* Contador de imágenes */}
                      <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-bold">
                        {imagenSeleccionada + 1} / {imagenes.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-9xl">
                  {producto.imagen}
                </div>
              )}
            </div>

            {/* Miniaturas - Desktop: Grid vertical, Mobile: Scroll horizontal */}
            {imagenes.length > 1 && (
              <div className="hidden lg:grid lg:grid-cols-6 gap-2">
                {imagenes.map((img, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setImagenSeleccionada(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      index === imagenSeleccionada
                        ? 'border-purple-500 shadow-lg shadow-purple-500/50'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${producto.nombre} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Miniaturas Mobile - Scroll Horizontal */}
            {imagenes.length > 1 && (
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {imagenes.map((img, index) => (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setImagenSeleccionada(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      index === imagenSeleccionada
                        ? 'border-purple-500 shadow-lg shadow-purple-500/50'
                        : 'border-white/10'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${producto.nombre} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Características Destacadas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-white text-sm font-bold">Garantía</p>
                <p className="text-gray-400 text-xs">1 año</p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                <Truck className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white text-sm font-bold">Envío</p>
                <p className="text-gray-400 text-xs">
                  {producto.envio_gratis === false && producto.precio_envio 
                    ? `$${producto.precio_envio}` 
                    : 'Gratis'}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center">
                <Package className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-white text-sm font-bold">Stock</p>
                <p className="text-gray-400 text-xs">{producto.stock} unid.</p>
              </div>
            </div>
          </motion.div>

          {/* Columna Derecha - Información */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Badge Stock */}
            <div>
              {producto.stock > 0 ? (
                <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
                  <CheckCircle className="w-4 h-4" />
                  En Stock ({producto.stock} disponibles)
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-full text-sm font-bold">
                  <XCircle className="w-4 h-4" />
                  Sin Stock
                </span>
              )}
            </div>

            {/* Título */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {producto.nombre}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-gray-400 text-sm">(128 reseñas)</span>
              </div>
            </div>

            {/* Precio */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <p className="text-gray-400 text-sm mb-2">Precio</p>
              <div className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                ${producto.precio.toLocaleString()}
              </div>
              <p className={`text-sm mt-2 flex items-center gap-1 ${
                producto.envio_gratis === false && producto.precio_envio 
                  ? 'text-blue-400' 
                  : 'text-green-400'
              }`}>
                <Truck className="w-4 h-4" />
                {producto.envio_gratis === false && producto.precio_envio 
                  ? `Envío: $${producto.precio_envio} a todo México` 
                  : 'Envío gratis a todo México'}
              </p>
            </div>

            {/* Selector de Cantidad */}
            {producto.stock > 0 && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <label className="block text-white font-bold mb-3">Cantidad</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-white w-16 text-center">
                    {cantidad}
                  </span>
                  <button
                    onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                    className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white font-bold transition-colors"
                  >
                    +
                  </button>
                  <span className="text-gray-400 text-sm">
                    ({producto.stock} disponibles)
                  </span>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="space-y-3">
              {/* Botón Comprar Ahora */}
              <motion.button
                whileHover={{ scale: producto.stock > 0 && !comprando ? 1.02 : 1 }}
                whileTap={{ scale: producto.stock > 0 && !comprando ? 0.98 : 1 }}
                onClick={handleComprarAhora}
                disabled={producto.stock <= 0 || comprando}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                  producto.stock > 0
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/50'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                {comprando ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    {producto.stock > 0 ? 'Comprar Ahora' : 'Sin Stock'}
                  </>
                )}
              </motion.button>

              {/* Botón Agregar al Carrito */}
              <motion.button
                whileHover={{ scale: producto.stock > 0 ? 1.02 : 1 }}
                whileTap={{ scale: producto.stock > 0 ? 0.98 : 1 }}
                onClick={handleAddToCart}
                disabled={producto.stock <= 0}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                  producto.stock > 0
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-6 h-6" />
                {producto.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
              </motion.button>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleFavorite}
                  className={`flex items-center justify-center gap-2 py-3 border rounded-xl font-bold transition-all ${
                    isFavorite 
                      ? 'bg-red-500/20 border-red-500 text-red-400' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-400' : ''}`} />
                  {isFavorite ? 'En Favoritos' : 'Favorito'}
                </button>
                <button 
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Compartir
                </button>
              </div>
            </div>

            {/* Descripción */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Descripción</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {producto.descripcion}
              </p>
            </div>

            {/* Especificaciones */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Especificaciones</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Marca</span>
                  <span className="text-white font-bold">Premium</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Garantía</span>
                  <span className="text-white font-bold">1 año</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Condición</span>
                  <span className="text-white font-bold">Nuevo</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Envío</span>
                  <span className="text-white font-bold">
                    {producto.envio_gratis === false && producto.precio_envio 
                      ? `$${producto.precio_envio}` 
                      : 'Gratis'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CSS para ocultar scrollbar en miniaturas mobile */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}