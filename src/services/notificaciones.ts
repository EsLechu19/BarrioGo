import * as Notifications from 'expo-notifications';
import { EstadoPedido } from '../types/Pedido';

// Docs versionados Expo SDK 57:
// https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
// Handler a nivel módulo: las locales se muestran aunque la app esté en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Pide permiso de notificaciones si todavía no fue concedido.
 * Nunca lanza: ante cualquier error (hardware, permisos) retorna false
 * y la app sigue funcionando sin notificar.
 */
export async function asegurarPermisoNotificaciones(): Promise<boolean> {
  try {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;
    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.granted;
  } catch {
    return false;
  }
}

/**
 * Dispara una notificación local con el nuevo estado del pedido.
 * try/catch silencioso: nunca lanza.
 */
export async function notificarCambioEstado(
  estado: EstadoPedido,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'BarrioGo',
        body: `Tu pedido cambió a ${estado.replace('_', ' ')}`,
      },
      trigger: null,
    });
  } catch {
    // Silencioso a propósito: sin permiso o error de hardware, la app sigue andando.
  }
}
