'use client';

import { motion } from 'framer-motion';
import { Users, Calendar, Zap, ArrowRight, ShoppingBag, Loader2, CreditCard, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTandas, TandaConParticipantes } from './services/tandasService';
import { getProductos } from './services/productosService';
import { supabase } from './lib/supabase';
import { useRouter } from 'next/navigation';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import toast from 'react-hot-toast';

// Interfaz extendida para incluir números reservados
interface TandaExtendida extends TandaConParticipantes {
  numeros_reservados: number;
  numeros_disponibles_reales: number;
}

export default function ProductosPage() {
  const [tandas, setTandas] = useState<TandaExtendida[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loadingTandas, setLoadingTandas] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [animarBotones, setAnimarBotones] = useState<{ [key: string]: boolean }>({});
  const [comprando, setComprando] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadTandas();
    loadProductos();
  }, []);

  const loadTandas = async () => {
    setLoadingTandas(true);
    try {
      // Obtener tandas con conteo de participantes
      const tandasData = await getTandas();
      
      // Para cada tanda, obtener también los números reservados
      const tandasConReservados = await Promise.all(
        tandasData.map(async (tanda) => {
          // Obtener números reservados
          const { count: reservadosCount } = await supabase
            .from('numeros_reservados')
            .select('*', { count: 'exact', head: true })
            .eq('tanda_id', tanda.id);
          
          const numeros_reservados = reservadosCount || 0;
          const numeros_ocupados_total = tanda.participantes_count + numeros_reservados;
          const numeros_disponibles_reales = tanda.participantes_max - numeros_ocupados_total;
          
          return {
            ...tanda,
            numeros_reservados,
            numeros_disponibles_reales
          };
        })
      );
      
      setTandas(tandasConReservados);
    } catch (error) {
      console.error('Error cargando tandas:', error);
    } finally {
      setLoadingTandas(false);
    }
  };

  const loadProductos = async () => {
    setLoadingProductos(true);
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoadingProductos(false);
    }
  };

  const handleAddToCart = (producto: any) => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para agregar al carrito');
      router.push('/login');
      return;
    }

    if (producto.stock <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    addToCart(producto);
    toast.success(`✅ ${producto.nombre} agregado al carrito`, {
      style: {
        background: '#111827',
        color: '#fff',
        border: '1px solid #a855f7',
      },
      iconTheme: { primary: '#a855f7', secondary: '#fff' },
    });

    setAnimarBotones((prev) => ({ ...prev, [producto.id]: true }));
    setTimeout(() => setAnimarBotones((prev) => ({ ...prev, [producto.id]: false })), 400);
  };

  const handleComprarAhora = async (e: React.MouseEvent, producto: any) => {
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

  const parseImagenes = (imagen_url: string): string[] => {
    if (!imagen_url) return [];
    try {
      const parsed = JSON.parse(imagen_url);
      return Array.isArray(parsed) ? parsed : [imagen_url];
    } catch {
      return imagen_url ? [imagen_url] : [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-x-hidden">
      {/* Fondo */}
      <div className="fixed inset-0 pointer-events-none opacity-50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-0 w-full h-96 bg-purple-500/10 blur-3xl" />
      </div>

      {/* HERO */}
      <section className="px-4 py-20 sm:py-28 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-6 text-sm text-white/80">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            100% Verificado
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-white block mb-2">Todo en un solo lugar y</span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 text-transparent bg-clip-text block">
               en pagos accesibles
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl mb-10">
            Alcanza tus metas con tandas seguras o adquiere productos de confianza
          </p>

          <button
            onClick={() => document.getElementById('tandas-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-purple-500/30 hover:scale-105 transition-all"
          >
            Explorar Tandas
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </section>

      {/* SECCIÓN TANDAS */}
      <section id="tandas-section" className="px-4 sm:px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block bg-purple-500/10 border border-purple-500/20 rounded-full px-5 py-2 mb-6">
              <span className="text-purple-400 text-sm font-semibold">TANDAS DISPONIBLES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              Tu Tanda{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                Perfecta
              </span>
            </h2>
            <p className="text-gray-400 text-base">Elige la que mejor se adapte a ti</p>
          </motion.div>

          {loadingTandas ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {tandas.map((tanda, i) => {
                // ✅ Cálculo correcto considerando reservados
                const llena = tanda.numeros_disponibles_reales <= 0;
                const numerosOcupadosTotal = tanda.participantes_count + tanda.numeros_reservados;
                const porcentaje = (numerosOcupadosTotal / tanda.participantes_max) * 100;
                
                const color =
                  i % 4 === 0
                    ? 'from-orange-500 to-yellow-500'
                    : i % 4 === 1
                    ? 'from-blue-500 to-cyan-500'
                    : i % 4 === 2
                    ? 'from-purple-500 to-pink-500'
                    : 'from-yellow-400 to-orange-400';

                return (
                  <motion.div
                    key={tanda.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 hover:bg-white/[0.05] hover:border-white/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="text-6xl">{tanda.imagen}</div>
                      {llena ? (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold">
                          Llena
                        </div>
                      ) : tanda.numeros_disponibles_reales <= 3 ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                          Últimos {tanda.numeros_disponibles_reales}
                        </div>
                      ) : (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          Disponible
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{tanda.nombre}</h3>
                    <div className={`text-4xl font-black bg-gradient-to-r ${color} text-transparent bg-clip-text mb-1`}>
                      ${tanda.monto.toLocaleString()}
                    </div>
                    <p className="text-gray-400 text-sm mb-6">Pago {tanda.frecuencia.toLowerCase()}</p>

                    {/* Estadísticas de ocupación */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>Lugares ocupados</span>
                        <span className="text-white font-semibold">
                          {numerosOcupadosTotal}/{tanda.participantes_max}
                        </span>
                      </div>
                      <div className="h-3 bg-white/20 rounded-full overflow-hidden border border-white/10">
                        <div 
                          style={{ width: `${Math.min(porcentaje, 100)}%` }} 
                          className={`h-full bg-gradient-to-r ${color} transition-all duration-300`} 
                        />
                      </div>
                    </div>



                    <div className="space-y-3 text-gray-300 text-sm mb-8">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <span>{tanda.duracion}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <span>Frecuencia {tanda.frecuencia}</span>
                      </div>
                      {tanda.numeros_disponibles_reales > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 text-green-400 font-bold text-center">
                            {tanda.numeros_disponibles_reales}
                          </span>
                          <span className="text-green-400 font-semibold">Lugares disponibles</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => router.push(`/tandas/${tanda.id}`)}
                      disabled={llena}
                      className={`w-full py-3 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                        !llena
                          ? `bg-gradient-to-r ${color} text-white hover:shadow-lg active:scale-95`
                          : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      {!llena ? (
                        <>
                          Ver Detalles <ArrowRight className="w-5 h-5" />
                        </>
                      ) : (
                        'No Disponible'
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* PRODUCTOS */}
      <section id="productos-section" className="px-4 sm:px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-pink-500/10 border border-pink-500/20 rounded-full px-5 py-2 mb-6">
              <span className="text-pink-400 text-sm font-semibold">PRODUCTOS DISPONIBLES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              Compra tus{' '}
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 text-transparent bg-clip-text">
                productos favoritos
              </span>
            </h2>
            <p className="text-gray-400 text-base">Explora nuestra colección</p>
          </div>

          {loadingProductos ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {productos.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  parseImagenes={parseImagenes}
                  handleComprarAhora={handleComprarAhora}
                  handleAddToCart={handleAddToCart}
                  animarBotones={animarBotones}
                  comprando={comprando}
                  router={router}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIOS Y FOOTER */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-white/10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-10">Lo que dicen nuestros clientes</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[{ nombre: 'María G.', texto: 'Me uní a una tanda y recibí mi dinero antes de lo esperado. ¡Excelente servicio!' },
              { nombre: 'Carlos R.', texto: 'Compré mi laptop gamer sin problema. El pago fue rápido y seguro.' },
              { nombre: 'Lucía T.', texto: 'Las tandas son confiables y los productos llegan bien empaquetados.' },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-white/[0.05] border border-white/10 rounded-2xl p-6 text-gray-300 hover:border-purple-400/30 transition-all"
              >
                <p className="italic mb-4">"{t.texto}"</p>
                <span className="text-purple-400 font-bold">— {t.nombre}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-gray-400 text-sm bg-slate-950">
        <p>
          © {new Date().getFullYear()}{' '}
          <span className="text-purple-400 font-semibold">RoxShop</span>. Todos los derechos reservados.
        </p>
        <div className="mt-3 flex justify-center gap-6 text-gray-500 text-base">
          <a href="#" className="hover:text-purple-400 transition-colors">Facebook</a>
          <a href="#" className="hover:text-purple-400 transition-colors">Instagram</a>
          <a href="#" className="hover:text-purple-400 transition-colors">Twitter</a>
        </div>
      </footer>
    </div>
  );
}

// ⭐ Componente separado para la tarjeta de producto con carrusel
function ProductoCard({ producto, parseImagenes, handleComprarAhora, handleAddToCart, animarBotones, comprando, router }: any) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      onClick={() => router.push(`/productos/${producto.id}`)}
      className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:bg-white/[0.05] hover:border-pink-400/20 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all cursor-pointer"
    >
      {/* Imagen con carrusel */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center p-3">
        {imagenes.length > 0 ? (
          <>
            <motion.img
              key={currentImageIndex}
              src={imagenes[currentImageIndex]}
              alt={producto.nombre}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-xl"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const icon = parent.querySelector('.fallback-icon');
                  if (icon) {
                    icon.classList.remove('hidden');
                  }
                }
              }}
            />
            {imagenes.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imagenes.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-pink-400 w-4'
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <ShoppingBag className="w-16 h-16 text-gray-600 fallback-icon" />
        )}
      </div>

      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{producto.nombre}</h3>
      <p className="text-gray-400 text-sm mb-3 line-clamp-2 min-h-[40px]">{producto.descripcion}</p>
      <div className="text-2xl font-black bg-gradient-to-r from-pink-400 to-purple-400 text-transparent bg-clip-text mb-4">
        ${producto.precio?.toLocaleString() || '0'}
      </div>

      {/* Botones de acción */}
      <div className="space-y-2">
        {/* Botón Comprar Ahora */}
        <motion.button
          whileTap={{ scale: producto.stock > 0 ? 0.95 : 1 }}
          onClick={(e) => handleComprarAhora(e, producto)}
          disabled={producto.stock <= 0 || comprando === producto.id}
          className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            producto.stock > 0
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:scale-105'
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
              ⚡ Comprar Ahora
            </>
          )}
        </motion.button>

        {/* Botón Agregar al Carrito */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          animate={animarBotones[producto.id] ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart(producto);
          }}
          className="w-full py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5 text-pink-400" />
          Agregar al Carrito
        </motion.button>
      </div>
    </motion.div>
  );
}