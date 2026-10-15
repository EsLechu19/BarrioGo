import Constants from 'expo-constants';
import type { Pedido } from '../types/Pedido';
import { ESTADO_LABELS } from '../utils/estadosPedido';
import { storage } from './storage';

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
const NOTIFICATION_CHANNEL_ID = 'order-status';

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
    // Android 13 does not show the permission prompt until a channel exists.
    await asegurarCanalAndroid(notifications);
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
  pedido: Pedido,
): Promise<void> {
  try {
    const notifications = await getNotifications();
    if (!notifications) return;
    await asegurarCanalAndroid(notifications);
    await notifications.scheduleNotificationAsync({
      content: {
        title: 'BarrioGo',
        body: `Tu pedido cambió a ${ESTADO_LABELS[pedido.estado].toLowerCase()}`,
      },
      trigger: null,
    });
  } catch {
    // Silencioso a propósito: sin permiso o error de hardware, la app sigue andando.
  }
}

async function asegurarCanalAndroid(notifications: NotificationsModule): Promise<void> {
  try {
    if (typeof notifications.setNotificationChannelAsync !== 'function') return;
    await notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Estado de pedidos',
      importance: 4,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  } catch {
    // Expo Go or an unavailable native module must remain a safe no-op.
  }
}

/**
 * Persists one customer status transition before optionally showing a local
 * OS notification. It is intentionally local-only: no push token or remote
 * notification service is involved.
 */
export async function registrarCambioEstado(
  usuarioId: string,
  pedido: Pedido,
): Promise<void> {
  const preferencias = await storage.loadUserPreferences(usuarioId);
  if (preferencias?.notificaciones === false) return;
  const notification = {
    id: `${pedido.id}:${pedido.estado}`,
    usuarioId,
    pedidoId: pedido.id,
    estado: pedido.estado,
    texto: `Tu pedido #${pedido.id} cambió a "${ESTADO_LABELS[pedido.estado]}"`,
    creadaEn: new Date().toISOString(),
    leida: false,
  };
  const added = await storage.appendNotification(usuarioId, notification);
  if (added) await notificarCambioEstado(pedido);
}
