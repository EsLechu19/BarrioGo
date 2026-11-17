
/**
 * BarrioGo - Servidor de notificaciones push
 *
 * Cliente crea pedido  -> notificación al negocio
 * Negocio confirma     -> notificación al cliente
 * Pedido en camino     -> notificación al cliente
 * Pedido entregado     -> notificación al cliente
 * Pedido cancelado     -> notificación a la otra parte
 *
 * Ejecutar:
 * npm run notificaciones
 *
 * Requisitos:
 * - Node.js 18+
 * - firebase-admin instalado
 * - firebase-sdk.json en la raíz
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../firebase-sdk.json');

// ========================================
// CONFIGURACIÓN DE FIREBASE
// ========================================

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

// Deben coincidir con app.json y notificaciones.ts.
const CHANNEL_ID = 'barriogo-pedidos-v2';
const SOUND = 'xd.wav';

// Estados conocidos para detectar transiciones.
const estadosPedidos = new Map();

let inicializado = false;

// ========================================
// MENSAJES DE NOTIFICACIÓN
// ========================================

const mensajesCliente = {
  confirmado: {
    title: '✅ ¡Pedido confirmado!',
    body: 'El negocio aceptó tu pedido.',
  },
  en_camino: {
    title: '🛵 ¡Tu pedido está en camino!',
    body: 'Tu pedido está en camino. ¡Prepárate para recibirlo!',
  },
  entregado: {
    title: '🎉 ¡Pedido entregado!',
    body: 'Gracias por comprar en BarrioGo.',
  },
  cancelado: {
    title: '❌ Pedido cancelado',
    body: 'Tu pedido fue cancelado.',
  },
};

// ========================================
// OBTENER TOKENS DE UN USUARIO
// ========================================

async function obtenerTokens(usuarioId) {
  if (!usuarioId) return [];

  const documento = await db
    .collection('users')
    .doc(usuarioId)
    .get();

  if (!documento.exists) {
    console.warn(`⚠️ Usuario no encontrado: ${usuarioId}`);
    return [];
  }

  const tokens = documento.data()?.expoPushTokens ?? [];

  if (!Array.isArray(tokens)) {
    console.warn(`⚠️ Tokens inválidos para ${usuarioId}`);
    return [];
  }

  return [...new Set(tokens)].filter(
    token =>
      typeof token === 'string' &&
      /^(ExponentPushToken|ExpoPushToken)\[.+\]$/.test(token)
  );
}

// ========================================
// OBTENER DUEÑO DEL NEGOCIO
// ========================================

async function obtenerDuenoNegocio(negocioId) {
  if (!negocioId) return null;

  const negocio = await db
    .collection('negocios')
    .doc(negocioId)
    .get();

  if (!negocio.exists) {
    console.warn(`⚠️ Negocio no encontrado: ${negocioId}`);
    return null;
  }

  return negocio.data()?.duenioId ?? null;
}

// ========================================
// ENVIAR PUSH MEDIANTE EXPO
// ========================================

async function enviarNotificacion(usuarioId, mensaje, pedidoId) {
  if (!usuarioId) {
    console.warn('⚠️ Notificación sin destinatario.');
    return;
  }

  const tokens = await obtenerTokens(usuarioId);

  if (tokens.length === 0) {
    console.log(`📵 Usuario sin tokens: ${usuarioId}`);
    return;
  }

  const notificaciones = tokens.map(token => ({
    to: token,
    title: mensaje.title,
    body: mensaje.body,
    sound: SOUND,
    channelId: CHANNEL_ID,
    priority: 'high',
    data: {
      tipo: 'pedido',
      pedidoId,
    },
  }));

  // Expo acepta lotes de hasta 100 mensajes.
  for (let i = 0; i < notificaciones.length; i += 100) {
    const lote = notificaciones.slice(i, i + 100);

    const respuesta = await fetch(
      'https://exp.host/--/api/v2/push/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lote),
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        `Error Expo Push: ${JSON.stringify(resultado)}`
      );
    }

    console.log(
      `📨 Pedido ${pedidoId} | destinatario ${usuarioId}`,
      JSON.stringify(resultado)
    );

    // Revisar también errores individuales del lote.
    const tickets = Array.isArray(resultado.data)
      ? resultado.data
      : [resultado.data];

    for (const ticket of tickets) {
      if (ticket?.status === 'error') {
        console.error(
          '❌ Expo rechazó una notificación:',
          ticket.message,
          ticket.details
        );
      }
    }
  }
}

// ========================================
// NUEVO PEDIDO -> NEGOCIO
// ========================================

async function notificarNuevoPedido(pedidoId, pedido) {
  const duenoId = await obtenerDuenoNegocio(pedido.negocioId);

  if (!duenoId) {
    console.warn(
      `⚠️ Pedido ${pedidoId}: negocio sin dueño vinculado.`
    );
    return;
  }

  await enviarNotificacion(
    duenoId,
    {
      title: '🔔 ¡Nuevo pedido en BarrioGo!',
      body: `Recibiste el pedido #${pedidoId}. Revísalo y confírmalo.`,
    },
    pedidoId
  );

  console.log(`🏪 Nuevo pedido ${pedidoId} notificado al negocio.`);
}

// ========================================
// CAMBIO DE ESTADO -> CLIENTE O NEGOCIO
// ========================================

async function notificarCambioEstado(
  pedidoId,
  pedido,
  estadoAnterior
) {
  const estadoNuevo = pedido.estado;

  if (estadoAnterior === estadoNuevo) return;

  console.log(
    `🔄 Pedido ${pedidoId}: ${estadoAnterior} -> ${estadoNuevo}`
  );

  if (estadoNuevo === 'cancelado') {
    const duenoId = await obtenerDuenoNegocio(
      pedido.negocioId
    );

    // Si cancela el cliente, avisar al negocio.
    // Si rechaza el negocio, avisar al cliente.
    const destinatario =
      pedido.canceladoPor === pedido.usuarioId
        ? duenoId
        : pedido.usuarioId;

    await enviarNotificacion(
      destinatario,
      {
        title: '❌ Pedido cancelado',
        body: `El pedido #${pedidoId} fue cancelado.`,
      },
      pedidoId
    );

    return;
  }

  const mensaje = mensajesCliente[estadoNuevo];

  if (!mensaje) return;

  await enviarNotificacion(
    pedido.usuarioId,
    {
      title: mensaje.title,
      body: `${mensaje.body} Pedido #${pedidoId}.`,
    },
    pedidoId
  );
}

// ========================================
// ESCUCHAR PEDIDOS DE FIRESTORE
// ========================================

console.log('🦙 Iniciando servidor de notificaciones BarrioGo...');

db.collection('pedidos').onSnapshot(
  async snapshot => {
    // La primera lectura incluye los pedidos existentes.
    // No debemos reenviar notificaciones antiguas.
    if (!inicializado) {
      snapshot.docs.forEach(documento => {
        estadosPedidos.set(
          documento.id,
          documento.data().estado
        );
      });

      inicializado = true;

      console.log('✅ Servidor conectado a Firestore.');
      console.log('👂 Escuchando nuevos pedidos y cambios de estado...');
      return;
    }

    for (const cambio of snapshot.docChanges()) {
      const pedidoId = cambio.doc.id;
      const pedido = cambio.doc.data();

      try {
        if (cambio.type === 'added') {
          estadosPedidos.set(pedidoId, pedido.estado);

          console.log(`🛒 Nuevo pedido: ${pedidoId}`);

          await notificarNuevoPedido(pedidoId, pedido);
        }

        if (cambio.type === 'modified') {
          const estadoAnterior = estadosPedidos.get(pedidoId);

          // Evitar notificar cuando solo cambia el pago u otro campo.
          if (estadoAnterior === undefined) {
            estadosPedidos.set(pedidoId, pedido.estado);
            continue;
          }

          if (estadoAnterior !== pedido.estado) {
            // Registrar el estado inmediatamente para evitar
            // notificaciones duplicadas por snapshots posteriores.
            estadosPedidos.set(pedidoId, pedido.estado);

            await notificarCambioEstado(
              pedidoId,
              pedido,
              estadoAnterior
            );
          }
        }

        if (cambio.type === 'removed') {
          estadosPedidos.delete(pedidoId);
        }
      } catch (error) {
        console.error(
          `❌ Error procesando pedido ${pedidoId}:`,
          error
        );
      }
    }
  },
  error => {
    console.error(
      '❌ Error escuchando pedidos en Firestore:',
      error
    );
  }
);

// ========================================
// APAGADO DEL SERVIDOR
// ========================================

process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo servidor BarrioGo...');
  process.exit(0);
});
