import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { escucharMisPedidos } from '../services/api';
import { firebaseReady } from '../services/firebase';
import {
  registrarCambioEstado,
} from '../services/notificaciones';
import type { EstadoPago, EstadoPedido, Pedido } from '../types/Pedido';

type EstadoPrevio = { estado: EstadoPedido; estadoPago?: EstadoPago };

/** Keeps customer notification history independent from screen mounting. */
export function CustomerNotificationBridge(): null {
  const { user, rol } = useAuth();
  const estadosPrevios = useRef<Record<string, EstadoPrevio>>({});

  useEffect(() => {
    estadosPrevios.current = {};

    if (!firebaseReady || !user || rol !== 'cliente') return;

    let activo = true;
    let primeraCarga = true;
    const uid = user.uid;
    const unsubscribe = escucharMisPedidos(
      uid,
      (pedidos: Pedido[]) => {
        if (!activo) return;

        const mapa: Record<string, EstadoPrevio> = {};
        if (primeraCarga) {
          // La primera lectura es la línea base: los pedidos que ya existían
          // no son avisos, son el estado previo.
          primeraCarga = false;
        } else {
          for (const pedido of pedidos) {
            const estadoPrevio = estadosPrevios.current[pedido.id];
            const esMercadoPago = pedido.metodoPago?.tipo === 'mercadopago_sandbox';
            const pagoConfirmado = esMercadoPago && pedido.estadoPago === 'pagado' &&
              estadoPrevio?.estadoPago !== 'pagado';
            if (pagoConfirmado) {
              void registrarCambioEstado(uid, pedido, 'pago_aprobado').catch(() => {
                // Notification failures do not affect payment state.
              });
            } else if (estadoPrevio === undefined) {
              if (esMercadoPago) continue;
              // Pedido nuevo: hecho en otro dispositivo o recién creado. El
              // historial deduplica por identificador, así que no duplica el
              // aviso que ya se mandó al confirmar el pedido.
              void registrarCambioEstado(uid, pedido, 'nuevo').catch(() => {
                // Fallos de historial o del SO no son fatales.
              });
            } else if (estadoPrevio.estado !== pedido.estado) {
              void registrarCambioEstado(uid, pedido).catch(() => {
                // Fallos de historial o del SO no son fatales.
              });
            }
          }
        }

        for (const pedido of pedidos) {
          mapa[pedido.id] = { estado: pedido.estado, estadoPago: pedido.estadoPago };
        }
        estadosPrevios.current = mapa;
      },
      () => {
        // Silencioso: las pantallas muestran los errores del listener.
      },
    );

    return () => {
      activo = false;
      unsubscribe();
      estadosPrevios.current = {};
    };
  }, [rol, user]);

  return null;
}
