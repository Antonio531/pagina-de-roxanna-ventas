import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/app/lib/supabase';
import { enviarEmailConfirmacion, notificarCompraAdmin } from '@/app/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('🎯 Evento recibido:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Pago completado:', session.id);
        await handleCheckoutCompleted(session);
        break;

      case 'payment_intent.succeeded':
        console.log('💰 Payment intent succeeded');
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed');
        break;

      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('💥 Error en webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('📦 Procesando sesión:', session.id);
    console.log('📋 Metadata:', session.metadata);

    const metadata = session.metadata;
    
    if (!metadata) {
      console.error('⚠️ No hay metadata en la sesión');
      return;
    }

    const userId = metadata.userId;
    const tipo = metadata.tipo;

    if (!userId || !tipo) {
      console.error('⚠️ Faltan userId o tipo en metadata');
      return;
    }

    // Obtener datos del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('nombre, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ Error obteniendo usuario:', userError);
      return;
    }

    // 1. Crear la orden
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .insert([{
        user_id: userId,
        tipo: tipo,
        total: (session.amount_total || 0) / 100,
        estado: 'pagado',
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        metadata: metadata,
      }])
      .select()
      .maybeSingle();

    if (ordenError) {
      console.error('❌ Error creando orden:', ordenError);
      throw ordenError;
    }

    console.log('✅ Orden creada:', orden.id);

    // 2. Si es una tanda
    if (tipo === 'tanda') {
      const tandaId = metadata.tandaId;
      const tandaNombre = metadata.tandaNombre;
      const numerosSeleccionados = metadata.numerosSeleccionados?.split(',').map(Number) || [];

      console.log(`🎲 Agregando ${numerosSeleccionados.length} números a tanda ${tandaId}`);

      for (const numero of numerosSeleccionados) {
        const { error: participanteError } = await supabase
          .from('tanda_participantes')
          .insert([{
            tanda_id: tandaId,
            user_id: userId,
            turno: numero,
            estado: 'activo',
            fecha_ingreso: new Date().toISOString(),
          }]);

        if (participanteError) {
          console.error(`❌ Error agregando número ${numero}:`, participanteError);
        } else {
          console.log(`✅ Número ${numero} agregado`);
        }
      }

      // Verificar si la tanda está llena
      const { data: tanda } = await supabase
        .from('tandas')
        .select('participantes_max, monto')
        .eq('id', tandaId)
        .maybeSingle();

      const { count } = await supabase
        .from('tanda_participantes')
        .select('*', { count: 'exact', head: true })
        .eq('tanda_id', tandaId)
        .eq('estado', 'activo');

      if (tanda && count && count >= tanda.participantes_max) {
        await supabase
          .from('tandas')
          .update({ disponible: false })
          .eq('id', tandaId);
        console.log('🔒 Tanda marcada como llena');
      }

      // ⭐ ENVIAR EMAIL DE CONFIRMACIÓN AL CLIENTE - TANDA
      try {
        const itemsParaEmail = numerosSeleccionados.map(num => ({
          tanda_nombre: `${tandaNombre} - Número #${num}`,
          monto: tanda?.monto || 0
        }));

        await enviarEmailConfirmacion({
          nombreCliente: user.nombre,
          emailCliente: user.email,
          tipo: 'tanda',
          items: itemsParaEmail,
          total: (session.amount_total || 0) / 100,
          ordenId: orden.id
        });
        console.log('📧 Email enviado al cliente:', user.email);

        // 🔥 NUEVO: Notificar al admin
        await notificarCompraAdmin({
          nombreCliente: user.nombre,
          emailCliente: user.email,
          tipo: 'tanda',
          items: itemsParaEmail,
          total: (session.amount_total || 0) / 100,
          ordenId: orden.id
        });
        console.log('📧 Notificación enviada al admin');
      } catch (emailError) {
        console.error('⚠️ Error enviando emails:', emailError);
      }
    }

    // 3. Si son productos
    if (tipo === 'productos') {
      const carrito = JSON.parse(metadata.carrito || '[]');
      
      console.log(`🛒 Agregando ${carrito.length} productos a orden`);

      const itemsParaEmail = [];

      for (const item of carrito) {
        const { error: itemError } = await supabase
          .from('orden_items')
          .insert([{
            orden_id: orden.id,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio: item.precio,
          }]);

        if (itemError) {
          console.error(`❌ Error agregando item:`, itemError);
        } else {
          console.log(`✅ Item agregado: ${item.cantidad}x producto ${item.producto_id}`);
        }

        // Guardar para el email
        itemsParaEmail.push({
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad
        });

        // Actualizar stock
        const { data: producto, error: fetchError } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', item.producto_id)
          .maybeSingle();

        if (fetchError) {
          console.error('⚠️ Error obteniendo producto:', fetchError);
          continue;
        }

        if (producto && producto.stock >= item.cantidad) {
          const nuevoStock = producto.stock - item.cantidad;
          
          const { error: stockError } = await supabase
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', item.producto_id);

          if (stockError) {
            console.error('⚠️ Error actualizando stock:', stockError);
          } else {
            console.log(`✅ Stock actualizado: ${producto.stock} → ${nuevoStock}`);
          }
        } else {
          console.error(`⚠️ Stock insuficiente para producto ${item.producto_id}`);
        }
      }

      // ⭐ ENVIAR EMAIL DE CONFIRMACIÓN AL CLIENTE - PRODUCTOS
      try {
        await enviarEmailConfirmacion({
          nombreCliente: user.nombre,
          emailCliente: user.email,
          tipo: 'productos',
          items: itemsParaEmail,
          total: (session.amount_total || 0) / 100,
          ordenId: orden.id
        });
        console.log('📧 Email enviado al cliente:', user.email);

        // 🔥 NUEVO: Notificar al admin
        await notificarCompraAdmin({
          nombreCliente: user.nombre,
          emailCliente: user.email,
          tipo: 'productos',
          items: itemsParaEmail,
          total: (session.amount_total || 0) / 100,
          ordenId: orden.id
        });
        console.log('📧 Notificación enviada al admin');
      } catch (emailError) {
        console.error('⚠️ Error enviando emails:', emailError);
      }
    }

    console.log('✅ Webhook procesado exitosamente');
  } catch (error: any) {
    console.error('💥 Error en handleCheckoutCompleted:', error);
    throw error;
  }
}