import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { escucharMisPedidos } from '../services/api';
import { firebaseReady } from '../services/firebase';
import {
  asegurarPermisoNotificaciones,
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
    void asegurarPermisoNotificaciones();
    const unsubscribe = escucharMisPedidos(
      uid,
      (pedidos: Pedido[]) => {
        if (!activo) return;

        const mapa: Record<string, EstadoPedido> = {};
        if (primeraCarga) {
          primeraCarga = false;
        } else {
          for (const pedido of pedidos) {
            const estadoPrevio = estadosPrevios.current[pedido.id];
            if (estadoPrevio !== undefined && estadoPrevio !== pedido.estado) {
              void registrarCambioEstado(uid, pedido).catch(() => {
                // Notification history and OS notification failures are non-fatal.
              });
            }
          }
        }

        for (const pedido of pedidos) mapa[pedido.id] = pedido.estado;
        estadosPrevios.current = mapa;
      },
      () => {
        // This bridge is intentionally silent; visible screens handle listener errors.
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
