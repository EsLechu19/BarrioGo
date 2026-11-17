import { useEffect } from 'react';
import { Platform } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import type { RootStackParamList } from '../navigation/RootStackParamList';

// Referencia al contenedor de navegación: permite abrir un pedido desde una
// notificación, que llega fuera del árbol de componentes.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const REINTENTOS_MAXIMOS = 10;
const ESPERA_REINTENTO_MS = 400;

/**
 * Abre el pedido al que apunta una notificación. La respuesta llega con
 * `data.pedidoId` (lo guarda el servicio de notificaciones).
 */
export function NotificationTapHandler(): null {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const abrir = (pedidoId: string, intentos: number): void => {
      if (!navigationRef.isReady()) {
        // En arranque en frío el contenedor todavía no está montado.
        if (intentos < REINTENTOS_MAXIMOS) {
          setTimeout(() => abrir(pedidoId, intentos + 1), ESPERA_REINTENTO_MS);
        }
        return;
      }
      navigationRef.navigate('PedidoDetalle', { pedidoId });
    };

    const procesar = (
      response: Notifications.NotificationResponse | null
    ): void => {
      if (!response) return;
      const data = response.notification.request.content.data;
      const pedidoId = typeof data?.pedidoId === 'string' ? data.pedidoId : null;
      if (!pedidoId) return;
      abrir(pedidoId, 0);
    };

    // La app se abrió con la notificación (estaba cerrada o en segundo plano).
    void Notifications.getLastNotificationResponseAsync()
      .then(procesar)
      .catch(() => {
        // Sin respuesta previa no hay nada que abrir.
      });

    // Notificación tocada con la app abierta.
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        procesar(response);
      });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
