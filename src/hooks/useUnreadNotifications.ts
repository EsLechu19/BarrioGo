import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { suscribirHistorialNotificaciones } from '../services/notificaciones';
import { storage } from '../services/storage';

/**
 * Cantidad de notificaciones que el usuario todavía no abrió. Se actualiza
 * cuando el historial cambia, al volver a la app y al montar la pantalla.
 */
export function useUnreadNotifications(): number {
  const { user } = useAuth();
  const [unread, setUnread] = useState<number>(0);

  const refresh = useCallback(async (): Promise<void> => {
    const uid = user?.uid;
    if (!uid) return;
    try {
      const notifications = await storage.loadNotifications(uid);
      setUnread(notifications.filter((item) => !item.leida).length);
    } catch {
      // Silencioso: la campana puede quedar desfasada, la app sigue igual.
    }
  }, [user?.uid]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    let cancelado = false;

    void storage
      .loadNotifications(uid)
      .then((notifications) => {
        if (cancelado) return;
        setUnread(notifications.filter((item) => !item.leida).length);
      })
      .catch(() => {
        // Silencioso: la campana puede quedar desfasada, la app sigue igual.
      });

    return () => {
      cancelado = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  useEffect(
    () =>
      suscribirHistorialNotificaciones((usuarioId) => {
        if (usuarioId === user?.uid) void refresh();
      }),
    [refresh, user?.uid],
  );

  return user?.uid ? unread : 0;
}
