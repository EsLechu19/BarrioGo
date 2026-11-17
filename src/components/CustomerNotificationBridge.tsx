import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { escucharMisPedidos } from '../services/api';
import { firebaseReady } from '../services/firebase';
import {
  registrarCambioEstado,
} from '../services/notificaciones';
import type { EstadoPedido, Pedido } from '../types/Pedido';

/** Keeps customer notification history independent from screen mounting. */
export function CustomerNotificationBridge(): null {
  const { user, rol } = useAuth();
  const estadosPrevios = useRef<Record<string, EstadoPedido>>({});

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

        const mapa: Record<string, EstadoPedido> = {};
        if (primeraCarga) {
          // La primera lectura es la línea base: los pedidos que ya existían
          // no son avisos, son el estado previo.
          primeraCarga = false;
        } else {
          for (const pedido of pedidos) {
            const estadoPrevio = estadosPrevios.current[pedido.id];
            if (estadoPrevio === undefined) {
              // Pedido nuevo: hecho en otro dispositivo o recién creado. El
              // historial deduplica por pedido+estado, así que no duplica el
              // aviso que ya se mandó al confirmar el pedido.
              void registrarCambioEstado(uid, pedido, 'nuevo').catch(() => {
                // Fallos de historial o del SO no son fatales.
              });
            } else if (estadoPrevio !== pedido.estado) {
              void registrarCambioEstado(uid, pedido).catch(() => {
                // Fallos de historial o del SO no son fatales.
              });
            }
          }
        }

        for (const pedido of pedidos) mapa[pedido.id] = pedido.estado;
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
