import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailCompraData {
  nombreCliente: string;
  emailCliente: string;
  tipo: 'productos' | 'tanda';
  items: any[];
  total: number;
  ordenId: string;
}

export async function enviarEmailConfirmacion(data: EmailCompraData) {
  const { nombreCliente, emailCliente, tipo, items, total, ordenId } = data;

  // HTML del email
  const htmlEmail = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 20px;
          }
          .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }
          .message {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .order-details {
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .order-id {
            font-size: 14px;
            color: #9333ea;
            font-weight: 600;
            margin-bottom: 20px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .item:last-child {
            border-bottom: none;
          }
          .item-name {
            color: #333;
            font-weight: 500;
          }
          .item-price {
            color: #666;
            font-weight: 600;
          }
          .total {
            background: #9333ea;
            color: white;
            padding: 20px;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
          }
          .total-label {
            font-size: 18px;
            font-weight: 600;
          }
          .total-amount {
            font-size: 32px;
            font-weight: 700;
          }
          .footer {
            background: #f9fafb;
            padding: 30px 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
            color: white;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Compra Confirmada!</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hola ${nombreCliente},
            </div>
            
            <div class="message">
              Tu pago ha sido procesado exitosamente. A continuación encontrarás los detalles de tu ${tipo === 'tanda' ? 'participación en tanda' : 'compra'}:
            </div>
            
            <div class="order-details">
              <div class="order-id">
                Orden #${ordenId.slice(-8).toUpperCase()}
              </div>
              
              ${items.map(item => `
                <div class="item">
                  <div class="item-name">${item.nombre || item.tanda_nombre}</div>
                  <div class="item-price">$${item.precio?.toLocaleString() || item.monto?.toLocaleString()}</div>
                </div>
              `).join('')}
              
              <div class="total">
                <div class="total-label">Total Pagado</div>
                <div class="total-amount">$${total.toLocaleString()}</div>
              </div>
            </div>
            
            <div class="message">
              ${tipo === 'tanda' 
                ? 'Tus números de tanda han sido asignados. Te notificaremos cuando sea tu turno de cobro.' 
                : 'Tu pedido será procesado a la brevedad. Recibirás otra notificación cuando sea enviado.'
              }
            </div>
            
            <center>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/mis-pedidos" class="button">
                Ver Mi Pedido
              </a>
            </center>
          </div>
          
          <div class="footer">
            <p>Gracias por tu compra en RoxShop</p>
            <p>Si tienes alguna pregunta, contáctanos.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'RoxShop <noreply@roxshop.org>', 
      to: emailCliente,
      subject: `✅ Confirmación de ${tipo === 'tanda' ? 'Tanda' : 'Compra'} - RoxShop`,
      html: htmlEmail,
    });

    console.log('✅ Email enviado a:', emailCliente);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

// ========== NOTIFICACIÓN PARA ADMIN ==========
interface EmailAdminData {
  nombreCliente: string;
  emailCliente: string;
  tipo: 'productos' | 'tanda';
  items: any[];
  total: number;
  ordenId: string;
}

export async function notificarCompraAdmin(data: EmailAdminData) {
  const { nombreCliente, emailCliente, tipo, items, total, ordenId } = data;

  const htmlEmail = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .badge {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 10px;
            font-size: 14px;
          }
          .content {
            padding: 40px 20px;
          }
          .section {
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .section-title {
            color: #059669;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            color: #6b7280;
            font-weight: 500;
          }
          .value {
            color: #111827;
            font-weight: 600;
          }
          .item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .item:last-child {
            border-bottom: none;
          }
          .item-name {
            color: #333;
            font-weight: 500;
          }
          .item-details {
            color: #6b7280;
            font-size: 14px;
          }
          .item-price {
            color: #059669;
            font-weight: 700;
            font-size: 18px;
          }
          .total-box {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 12px;
            text-align: center;
            margin-top: 20px;
          }
          .total-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 5px;
          }
          .total-amount {
            font-size: 42px;
            font-weight: 700;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .timestamp {
            color: #9ca3af;
            font-size: 13px;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Nueva Compra Recibida</h1>
            <div class="badge">
              ${tipo === 'tanda' ? '🎲 Tanda' : '🛍️ Productos'}
            </div>
          </div>
          
          <div class="content">
            <!-- Información del Cliente -->
            <div class="section">
              <div class="section-title">👤 Cliente</div>
              <div class="info-row">
                <span class="label">Nombre</span>
                <span class="value">${nombreCliente}</span>
              </div>
              <div class="info-row">
                <span class="label">Email</span>
                <span class="value">${emailCliente}</span>
              </div>
              <div class="info-row">
                <span class="label">ID Orden</span>
                <span class="value">#${ordenId.slice(-8).toUpperCase()}</span>
              </div>
            </div>
            
            <!-- Items Comprados -->
            <div class="section">
              <div class="section-title">
                ${tipo === 'tanda' ? '🎲 Números de Tanda' : '🛒 Productos'}
              </div>
              
              ${items.map(item => {
                if (tipo === 'tanda') {
                  return `
                    <div class="item">
                      <div>
                        <div class="item-name">${item.tanda_nombre}</div>
                      </div>
                      <div class="item-price">$${item.monto?.toLocaleString()}</div>
                    </div>
                  `;
                } else {
                  return `
                    <div class="item">
                      <div>
                        <div class="item-name">${item.nombre}</div>
                        <div class="item-details">Cantidad: ${item.cantidad}</div>
                      </div>
                      <div class="item-price">$${item.precio?.toLocaleString()}</div>
                    </div>
                  `;
                }
              }).join('')}
            </div>
            
            <!-- Total -->
            <div class="total-box">
              <div class="total-label">TOTAL RECIBIDO</div>
              <div class="total-amount">$${total.toLocaleString()} MXN</div>
            </div>
            
            <div class="timestamp">
              📅 ${new Date().toLocaleString('es-MX', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}
            </div>
          </div>
          
          <div class="footer">
            <p>📧 Notificación automática de RoxShop</p>
            <p>Revisa tu panel de administración para más detalles</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: 'RoxShop Notificaciones <noreply@roxshop.org>',
      to: 'antonioherbert291@gmail.com', // 🔥 CAMBIA ESTO POR TU EMAIL REAL
      subject: `🛒 Nueva ${tipo === 'tanda' ? 'Tanda' : 'Compra'} - $${total.toLocaleString()} MXN`,
      html: htmlEmail,
    });

    console.log('✅ Notificación enviada al admin');
  } catch (error) {
    console.error('❌ Error enviando notificación al admin:', error);
  }
}