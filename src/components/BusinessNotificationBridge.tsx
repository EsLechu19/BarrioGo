import { useEffect, useRef } from 'react';

import { useAuth } from '../context/AuthContext';
import { useNegocioId } from '../hooks/useNegocioId';
import { escucharPedidosNegocio } from '../services/api';
import { firebaseReady } from '../services/firebase';
import {
  notificarCancelacionNegocio,
  notificarNuevoPedidoNegocio,
} from '../services/notificaciones';
import { storage } from '../services/storage';
import type { EstadoPago, EstadoPedido, Pedido } from '../types/Pedido';

interface EstadoPedidoNotificacion {
  estado: EstadoPedido;
  estadoPago?: EstadoPago;
}

/**
 * Avisa al dueño del negocio cuando entra un pedido o cuando el cliente lo
 * cancela. Vive fuera de las pantallas para que el aviso no dependa de que
 * el panel esté abierto.
 */
export function BusinessNotificationBridge(): null {
  const { user, rol } = useAuth();
  const { negocioId } = useNegocioId();
  const estadosPrevios = useRef<Record<string, EstadoPedidoNotificacion>>({});

  useEffect(() => {
    estadosPrevios.current = {};

    if (!firebaseReady || !user || rol !== 'negocio' || !negocioId) return;

    let activo = true;
    let primeraCarga = true;
    const uid = user.uid;

    const unsubscribe = escucharPedidosNegocio(
      negocioId,
      (pedidos: Pedido[]) => {
        if (!activo) return;

        const mapa: Record<string, EstadoPedidoNotificacion> = {};
        if (primeraCarga) {
          // Línea base: los pedidos que ya existían no son avisos nuevos.
          primeraCarga = false;
        } else {
          for (const pedido of pedidos) {
            const estadoPrevio = estadosPrevios.current[pedido.id];
            const esMercadoPagoSandbox = pedido.metodoPago?.tipo === 'mercadopago_sandbox';
            const puedeAvisarNuevo = !esMercadoPagoSandbox || pedido.estadoPago === 'pagado';

            if (estadoPrevio === undefined) {
              if (puedeAvisarNuevo) void avisarPedidoNuevo(uid, pedido);
              continue;
            }

            const seConfirmoPagoMercadoPago = esMercadoPagoSandbox &&
              estadoPrevio.estadoPago !== 'pagado' && pedido.estadoPago === 'pagado';
            if (seConfirmoPagoMercadoPago) {
              void avisarPedidoNuevo(uid, pedido);
            }

            if (estadoPrevio.estado !== pedido.estado && pedido.estado === 'cancelado') {
              // Cancelación del cliente. Si la hizo el propio negocio al
              // rechazar, no se avisa: ya sabe lo que hizo.
              if (pedido.canceladoPor !== uid) {
                void avisarPedidoCancelado(uid, pedido);
              }
            }
          }
        }

        for (const pedido of pedidos) {
          mapa[pedido.id] = {
            estado: pedido.estado,
            estadoPago: pedido.estadoPago,
          };
        }
        estadosPrevios.current = mapa;
      },
      () => {
        // Silencioso: el panel muestra los errores de su propio listener.
      },
    );

    return () => {
      activo = false;
      unsubscribe();
      estadosPrevios.current = {};
    };
  }, [negocioId, rol, user]);

  return null;
}

async function notificacionesDeshabilitadas(usuarioId: string): Promise<boolean> {
  try {
    const preferencias = await storage.loadUserPreferences(usuarioId);
    return preferencias?.notificaciones === false;
  } catch {
    return false;
  }
}

async function avisarPedidoNuevo(
  usuarioId: string,
  pedido: Pedido,
): Promise<void> {
  if (await notificacionesDeshabilitadas(usuarioId)) return;
  await notificarNuevoPedidoNegocio(pedido);
}

async function avisarPedidoCancelado(
  usuarioId: string,
  pedido: Pedido,
): Promise<void> {
  if (await notificacionesDeshabilitadas(usuarioId)) return;
  await notificarCancelacionNegocio(pedido);
}
