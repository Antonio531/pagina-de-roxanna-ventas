'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, User, Edit3 } from 'lucide-react';
import Link from 'next/link';

export default function EnvioPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const [loading, setLoading] = useState(false);
  const [carritoListo, setCarritoListo] = useState<any[]>([]);
  const [direccionGuardada, setDireccionGuardada] = useState<any>(null);
  const [editando, setEditando] = useState(false);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: '',
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigo_postal: '',
    referencias: '',
  });

  // 🔹 Autocompletar ciudad y estado según el CP
  const handlePostalChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const codigo = e.target.value.trim();
    setFormData({ ...formData, codigo_postal: codigo });

    if (codigo.length === 5) {
      try {
        const res = await fetch(`https://api.zippopotam.us/mx/${codigo}`);
        if (!res.ok) throw new Error('Código no encontrado');
        const data = await res.json();

        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          setFormData((prev) => ({
            ...prev,
            ciudad: place['place name'] || prev.ciudad,
            estado: place['state'] || prev.estado,
          }));
          toast.success('Dirección completada automáticamente 🧭');
        }
      } catch (err) {
        toast.error('Código postal no encontrado');
      }
    }
  };

  // 🔹 Esperar a que el usuario esté autenticado
  useEffect(() => {
    if (!user) return;

    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión');
      router.push('/login');
      return;
    }

    const carritoGuardado = localStorage.getItem('cart');
    let carritoFinal: any[] = [];

    if (cart.length > 0) carritoFinal = cart;
    else if (carritoGuardado) {
      try {
        carritoFinal = JSON.parse(carritoGuardado);
      } catch {
        carritoFinal = [];
      }
    }

    if (!carritoFinal || carritoFinal.length === 0) {
      toast.error('Tu carrito está vacío');
      router.push('/productos');
      return;
    }

    setCarritoListo(carritoFinal);
    loadDireccion();
  }, [user, isAuthenticated, cart]);

  // 🔹 Cargar dirección del usuario
  const loadDireccion = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('direcciones_envio')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando dirección:', error);
      }

      if (data) {
        setDireccionGuardada(data);
        setFormData({
          nombre_completo: data.nombre_completo,
          telefono: data.telefono,
          calle: data.calle,
          numero_exterior: data.numero_exterior,
          numero_interior: data.numero_interior || '',
          colonia: data.colonia,
          ciudad: data.ciudad,
          estado: data.estado,
          codigo_postal: data.codigo_postal,
          referencias: data.referencias || '',
        });
      }
    } catch (error) {
      console.error('Error cargando dirección:', error);
    }
  };

  // 🧾 Guardar o actualizar dirección
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('direcciones_envio').upsert([
        {
          user_id: user!.id,
          ...formData,
          es_principal: true,
        },
      ]);

      if (error) throw error;

      toast.success('Dirección guardada correctamente');
      setDireccionGuardada(formData);
      setEditando(false);

      await continuarPago();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la dirección');
    } finally {
      setLoading(false);
    }
  };

  // 💳 Continuar con pago
  const continuarPago = async () => {
    setLoading(true);
    try {
      const total = carritoListo.reduce((sum, item) => {
        const precio = Number(item.precio) || 0;
        const cantidad = Number(item.quantity) || 1;
        return sum + precio * cantidad;
      }, 0);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'productos',
          items: carritoListo,
          userId: user!.id,
          metadata: {
            total: total.toString(),
            ...formData,
          },
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.url) throw new Error('No se recibió URL de pago');

      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const total = carritoListo.reduce((sum, item) => {
    const precio = Number(item.precio) || 0;
    const cantidad = Number(item.quantity) || 1;
    return sum + precio * cantidad;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/Carrito"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al carrito
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Datos de Envío</h1>
          <p className="text-gray-400">Ingresa o confirma tu dirección de entrega</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* ✅ Tarjeta si ya hay dirección */}
            {direccionGuardada && !editando ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:border-purple-400/30 hover:bg-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Dirección guardada</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {direccionGuardada.nombre_completo} <br />
                      {direccionGuardada.calle} #{direccionGuardada.numero_exterior}{' '}
                      {direccionGuardada.numero_interior
                        ? `Int. ${direccionGuardada.numero_interior}`
                        : ''}
                      , {direccionGuardada.colonia}, {direccionGuardada.ciudad},{' '}
                      {direccionGuardada.estado}, C.P. {direccionGuardada.codigo_postal}
                      <br />
                      Tel. {direccionGuardada.telefono}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditando(true)}
                    className="text-purple-400 hover:text-pink-400 transition-colors flex items-center gap-1 text-sm font-semibold"
                  >
                    <Edit3 className="w-4 h-4" /> Editar
                  </button>
                </div>

                <button
                  onClick={continuarPago}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Usar estos datos y continuar al pago'}
                </button>
              </div>
            ) : (
              // 🧾 Formulario
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">
                      {direccionGuardada ? 'Editar Dirección' : 'Datos Personales'}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre Completo"
                      value={formData.nombre_completo}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre_completo: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">Dirección</h2>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Calle"
                      value={formData.calle}
                      onChange={(e) =>
                        setFormData({ ...formData, calle: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Número Exterior"
                        value={formData.numero_exterior}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numero_exterior: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Número Interior"
                        value={formData.numero_interior}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numero_interior: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Colonia"
                      value={formData.colonia}
                      onChange={(e) =>
                        setFormData({ ...formData, colonia: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Ciudad"
                        value={formData.ciudad}
                        onChange={(e) =>
                          setFormData({ ...formData, ciudad: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                        required
                      />

                      <input
                        type="text"
                        placeholder="Estado"
                        value={formData.estado}
                        onChange={(e) =>
                          setFormData({ ...formData, estado: e.target.value })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                        required
                      />
                    </div>

                    {/* 🔹 Código Postal con autocompletado */}
                    <input
                      type="text"
                      placeholder="Código Postal"
                      value={formData.codigo_postal}
                      onChange={handlePostalChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      required
                    />

                    <textarea
                      placeholder="Referencias (opcional)"
                      value={formData.referencias}
                      onChange={(e) =>
                        setFormData({ ...formData, referencias: e.target.value })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white h-24"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar y continuar al pago'}
                </button>
              </form>
            )}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Resumen del Pedido</h2>
              <div className="space-y-3 mb-4">
                {carritoListo.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {item.nombre} x{item.quantity}
                    </span>
                    <span className="text-white font-bold">
                      ${((item.precio || 0) * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
