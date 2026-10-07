import Constants from 'expo-constants';
import { EstadoPedido } from '../types/Pedido';

// Docs versionados Expo SDK 57:
// https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
//
// Desde SDK 53 el push de expo-notifications fue removido de Expo Go: con
// solo importar el módulo ahí, el arranque muestra el cartel de error. Por
// eso NO hay import estático: el módulo se carga perezosamente con import()
// dinámico y únicamente fuera de Expo Go. En Expo Go todo es no-op seguro.

type NotificationsModule = typeof import('expo-notifications');

let modulo: NotificationsModule | null = null;
let handlerListo = false;

function enExpoGo(): boolean {
  try {
    return Constants.appOwnership === 'expo';
  } catch {
    return false;
  }
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (enExpoGo()) return null;
  if (modulo) return modulo;
  try {
    const cargado: NotificationsModule = await import('expo-notifications');
    modulo = cargado;
    if (!handlerListo) {
      handlerListo = true;
      // Las locales se muestran aunque la app esté en primer plano.
      cargado.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
    return modulo;
  } catch {
    return null;
  }
}

/**
 * Pide permiso de notificaciones si todavía no fue concedido.
 * En Expo Go retorna false sin cargar el módulo. Nunca lanza: ante
 * cualquier error (hardware, permisos) retorna false y la app sigue
 * funcionando sin notificar.
 */
export async function asegurarPermisoNotificaciones(): Promise<boolean> {
  try {
    const notifications = await getNotifications();
    if (!notifications) return false;
    const actual = await notifications.getPermissionsAsync();
    if (actual.granted) return true;
    const pedido = await notifications.requestPermissionsAsync();
    return pedido.granted;
  } catch {
    return false;
  }
}

/**
 * Dispara una notificación local con el nuevo estado del pedido.
 * En Expo Go es no-op. try/catch silencioso: nunca lanza.
 */
export async function notificarCambioEstado(
  estado: EstadoPedido,
): Promise<void> {
  try {
    const notifications = await getNotifications();
    if (!notifications) return;
    await notifications.scheduleNotificationAsync({
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
