import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  throw new Error("⚠️ Falta STRIPE_SECRET_KEY en .env.local");
}

const stripe = new Stripe(stripeSecret);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipo, items, userId, metadata } = body;

    console.log("🔍 Request recibido:", { tipo, userId, metadata });

    let lineItems: any[] = [];
    let sessionMetadata: any = {
      userId: userId || "guest",
      tipo: tipo || "productos",
    };

    // 🎯 CASO 1: Pago de TANDA
    if (tipo === "tanda") {
      if (!metadata?.tandaNombre || !metadata?.montoTotal) {
        return NextResponse.json(
          { error: "Datos de tanda incompletos" },
          { status: 400 }
        );
      }

      const numeros = metadata.numerosSeleccionados?.split(",") || [];

      lineItems = [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: metadata.tandaNombre,
              description: `${numeros.length} número(s) - Turnos: ${metadata.numerosSeleccionados}`,
            },
            unit_amount: Math.round(Number(metadata.montoTotal) * 100),
          },
          quantity: 1,
        },
      ];

      sessionMetadata = {
        ...sessionMetadata,
        ...metadata,
      };
    }

    // 🛍️ CASO 2: Pago de PRODUCTOS (carrito)
    else if (tipo === "productos" || items) {
      if (!items || items.length === 0) {
        return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
      }

      // Crear line items
      lineItems = items.map((item: any) => ({
        price_data: {
          currency: "mxn",
          product_data: { name: item.nombre },
          unit_amount: Math.round(Number(item.precio) * 100),
        },
        quantity: Number(item.quantity) || 1,
      }));

      // Mapear carrito para guardar en Stripe
      const carritoParaWebhook = items.map((item: any) => ({
        producto_id: item.id,
        nombre: item.nombre,
        cantidad: item.quantity || 1,
        precio: Number(item.precio) || 0,
      }));

      console.log("📦 Carrito mapeado:", carritoParaWebhook);
      sessionMetadata.carrito = JSON.stringify(carritoParaWebhook);

      // ✅ NUEVO: Agregar dirección al metadata
      if (
        metadata?.nombre_completo ||
        metadata?.telefono ||
        metadata?.calle ||
        metadata?.colonia
      ) {
        const direccionCompleta = {
          nombre_completo: metadata.nombre_completo || "",
          telefono: metadata.telefono || "",
          calle: metadata.calle || "",
          numero_exterior: metadata.numero_exterior || "",
          numero_interior: metadata.numero_interior || "",
          colonia: metadata.colonia || "",
          ciudad: metadata.ciudad || "",
          estado: metadata.estado || "",
          codigo_postal: metadata.codigo_postal || "",
          referencias: metadata.referencias || "",
        };

        sessionMetadata.direccion_envio = JSON.stringify(direccionCompleta);
        console.log("✅ Dirección agregada al metadata:", direccionCompleta);
      } else {
        console.log("⚠️ No se recibió dirección en el request");
      }
    }

    // 🧾 Verificación final
    else {
      return NextResponse.json(
        { error: "Tipo de pago no válido" },
        { status: 400 }
      );
    }

    console.log("📋 Metadata final:", sessionMetadata);

    // ✅ Crear sesión en Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || req.headers.get("origin")
      }/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_BASE_URL || req.headers.get("origin")
      }/cancel`,
      metadata: sessionMetadata,
    });

    console.log("✅ Sesión de Stripe creada:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Error Stripe:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
