'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, CheckCircle, XCircle, CreditCard, Loader2 } from 'lucide-react';
import { getProductos, Producto } from '../services/productosService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [comprando, setComprando] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    setLoading(true);
    const data = await getProductos();
    setProductos(data);
    setLoading(false);
  };

  const handleAddToCart = (e: React.MouseEvent, producto: Producto) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para agregar al carrito');
      router.push('/login');
      return;
    }

    if (producto.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    addToCart({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      quantity: 1,
    });

    toast.success(`${producto.nombre} agregado al carrito 🛒`);
  };

  const handleBuyNow = async (e: React.MouseEvent, producto: Producto) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para continuar');
      router.push('/login');
      return;
    }

    if (producto.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    setComprando(producto.id);
    toast.success(`Preparando tu compra de ${producto.nombre} 💳`);

    const productoCompra = [
      {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        quantity: 1,
      },
    ];

    localStorage.setItem('cart', JSON.stringify(productoCompra));
    await new Promise((res) => setTimeout(res, 1200));
    router.push('/envio');
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-purple-500/10 border border-purple-500/20 rounded-full px-5 py-2 mb-6">
            <span className="text-purple-400 text-sm font-semibold">
              🛍️ PRODUCTOS DISPONIBLES
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Nuestros{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Productos
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Compra los mejores productos con garantía
          </p>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No hay productos disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {productos.map((producto, index) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                index={index}
                comprando={comprando}
                handleAddToCart={handleAddToCart}
                handleBuyNow={handleBuyNow}
                router={router}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ⭐ Componente separado para cada producto con carrusel
function ProductoCard({ producto, index, comprando, handleAddToCart, handleBuyNow, router }: any) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const imagenes = parseImagenes(producto.imagen_url);

  // Carrusel automático de imágenes
  useEffect(() => {
    if (imagenes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagenes.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [imagenes.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      onClick={() => router.push(`/productos/${producto.id}`)}
      className="group relative cursor-pointer"
    >
      {/* Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-60 transition-opacity duration-500" />

      {/* Card */}
      <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/20 transition-all h-full flex flex-col">
        
        {/* Badge Stock */}
        <div className="absolute top-4 right-4 z-10">
          {producto.stock > 0 ? (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Stock: {producto.stock}
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Sin stock
            </div>
          )}
        </div>

        {/* Imagen con Carrusel */}
<div className="relative w-full h-48 rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center p-3">
  {imagenes.length > 0 ? (
    <>
      <motion.img
        key={currentImageIndex}
        src={imagenes[currentImageIndex]}
        alt={producto.nombre}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-xl" // ⭐ Agregado rounded-xl
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const fallback = parent.querySelector('.fallback-icon');
            if (fallback) {
              fallback.classList.remove('hidden');
            }
          }
        }}
      />
      
      {/* Indicadores de imágenes */}
      {imagenes.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {imagenes.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentImageIndex
                  ? 'bg-purple-400 w-4'
                  : 'bg-white/30 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </>
  ) : (
    <Package className="w-16 h-16 text-gray-600 fallback-icon" />
  )}
  
  {/* Fallback emoji si no hay imagen */}
  {!producto.imagen_url && producto.imagen && (
    <div className="text-6xl">{producto.imagen}</div>
  )}
</div>

        {/* Título */}
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-1">
          {producto.nombre}
        </h3>

        {/* Descripción */}
        <p className="text-gray-400 text-sm mb-4 flex-grow line-clamp-2 min-h-[40px]">
          {producto.descripcion}
        </p>

        {/* Precio */}
        <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text mb-6">
          ${producto.precio.toLocaleString()}
        </div>

        {/* Botones */}
        <div className="space-y-3">
          {/* Agregar al carrito */}
          <motion.button
            whileHover={{ scale: producto.stock > 0 ? 1.02 : 1 }}
            whileTap={{ scale: producto.stock > 0 ? 0.98 : 1 }}
            onClick={(e) => handleAddToCart(e, producto)}
            disabled={producto.stock <= 0}
            className={`w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
              producto.stock > 0
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Agregar al Carrito
          </motion.button>

          {/* Comprar ahora */}
          <motion.button
            whileHover={{ scale: producto.stock > 0 ? 1.02 : 1 }}
            whileTap={{ scale: producto.stock > 0 ? 0.98 : 1 }}
            onClick={(e) => handleBuyNow(e, producto)}
            disabled={producto.stock <= 0 || comprando === producto.id}
            className={`w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
              producto.stock > 0
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:shadow-lg hover:shadow-pink-500/30'
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
            }`}
          >
            {comprando === producto.id ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Comprar Ahora
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}