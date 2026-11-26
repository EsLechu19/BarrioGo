
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import * as Notifications from 'expo-notifications';

import type { Pedido } from '../types/Pedido';
import { ESTADO_LABELS } from '../utils/estadosPedido';
import { storage } from './storage';

export const NOTIFICATION_CHANNEL_ID = 'barriogo-pedidos-v2';

// Sonido propio de la app. Solo existe dentro del bundle de un build:
// en Expo Go se usa el sonido por defecto del sistema.
const NOTIFICATION_SOUND = 'xd.wav';

export type RolNotificacion = 'cliente' | 'negocio';

// Lo mínimo de un pedido que necesita una notificación. Permite avisar un
// pedido recién creado sin inventar los datos que solo living en Firestore.
export type PedidoNotificable = Pick<Pedido, 'id' | 'estado'>;

// Detecta Expo Go por el módulo nativo, no por Constants.appOwnership:
// ese campo ya no viaja en el mapa de constantes de expo-constants 57 y
// está deprecado en favor de Constants.executionEnvironment.
const enExpoGo = () => isRunningInExpoGo();

// Mostrar notificaciones con la aplicación abierta.
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // Mientras la app está abierta, los bridges ya generan el aviso local
        // correspondiente. El push remoto se conserva para segundo plano.
        const esPushRemoto =
          notification.request.content.data?.origen === 'remota';

        return {
          shouldShowBanner: !esPushRemoto,
          shouldShowList: !esPushRemoto,
          shouldPlaySound: !esPushRemoto,
          shouldSetBadge: false,
        };
      },
    });
  } catch (error) {
    console.warn('No se pudo configurar el handler de notificaciones:', error);
  }
}

// Canal Android: ícono y sonido personalizados.
export async function configurarCanalNotificaciones(): Promise<void> {
  if (Platform.OS !== 'android' || enExpoGo()) return;

  await Notifications.setNotificationChannelAsync(
    NOTIFICATION_CHANNEL_ID,
    {
      name: 'Pedidos de BarrioGo',
      description: 'Notificaciones para clientes y negocios',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F97316',
      sound: 'xd.wav',
    }
  );
}

export async function asegurarPermisoNotificaciones(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;

    await configurarCanalNotificaciones();

    const permisos = await Notifications.getPermissionsAsync();

    if (permisos.granted) return true;

    const resultado = await Notifications.requestPermissionsAsync();

    return resultado.granted;
  } catch (error) {
    console.warn('Error al solicitar permisos:', error);
    return false;
  }
}

// Mensajes personalizados por rol y evento.
export function obtenerMensajeNotificacion(
  pedido: Pedido,
  rol: RolNotificacion,
  evento: 'nuevo' | 'estado' | 'cancelado' = 'estado'
): { titulo: string; cuerpo: string } {
  const numero = `#${pedido.id}`;
  const nombreNegocio = pedido.negocioNombre || 'negocio';

  if (rol === 'negocio') {
    if (evento === 'nuevo') {
      return {
        titulo: '📦 Nuevo pedido',
        cuerpo: `Recibiste un pedido de ${nombreNegocio}. Revísalo y confírmalo.`,
      };
    }

    if (evento === 'cancelado' || pedido.estado === 'cancelado') {
      return {
        titulo: '❌ Pedido cancelado',
        cuerpo: `El pedido ${numero} fue cancelado.`,
      };
    }

    return {
      titulo: 'BarrioGo Negocios',
      cuerpo: `El pedido ${numero} cambió a ${ESTADO_LABELS[pedido.estado]}.`,
    };
  }

  switch (pedido.estado) {
    case 'pendiente':
      return {
        titulo: '🛒 Pedido recibido',
        cuerpo: `Tu pedido fue registrado. Espera la confirmación.`,
      };

    case 'confirmado':
      return {
        titulo: '✅ Pedido listo',
        cuerpo: `${nombreNegocio} aceptó. Tu pago ya está confirmado. ¡Gracias!`,
      };

    case 'en_camino':
      return {
        titulo: '🚗 En camino',
        cuerpo: `El delivery ya está en camino. Llegará pronto.`,
      };

    case 'entregado':
      return {
        titulo: '🎉 Pedido entregado',
        cuerpo: `Tu pedido llegó. ¡Gracias por confiar en nosotros!`,
      };

    case 'cancelado':
      return {
        titulo: '❌ Pedido cancelado',
        cuerpo: `El pedido fue cancelado. Tu pago será devuelto según método.`,
      };

    default:
      return {
        titulo: '🦙 BarrioGo',
        cuerpo: `Tu pedido ${numero} cambió de estado.`,
      };
  }
}

// Mostrar notificación local personalizada.
export async function notificarPedido(
  pedido: PedidoNotificable,
  rol: RolNotificacion,
  evento: 'nuevo' | 'estado' | 'cancelado' = 'estado',
  onPermisoOtorgado?: () => void,
): Promise<void> {
  try {
    if (Platform.OS === 'web') return;

    const autorizado = await asegurarPermisoNotificaciones();
    if (!autorizado) return;

    if (onPermisoOtorgado) {
      try {
        onPermisoOtorgado();
      } catch {
        // Un callback con error no puede romper la notificación.
      }
    }

    const mensaje = obtenerMensajeNotificacion(pedido as Pedido, rol, evento);

    // En Expo Go no existe el canal ni el sonido de la app: se usa el
    // canal y el sonido por defecto del sistema.
    const conAssetsPropios = !enExpoGo();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: mensaje.titulo,
        body: mensaje.cuerpo,
        ...(conAssetsPropios ? { sound: NOTIFICATION_SOUND } : {}),
        data: {
          pedidoId: pedido.id,
          rol,
          evento,
          tipo: 'pedido',
          origen: 'local',
        },
      },
      trigger:
    Platform.OS === 'android'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          ...(conAssetsPropios
            ? { channelId: NOTIFICATION_CHANNEL_ID }
            : {}),
        }
      : null,
    });
  } catch (error) {
    console.warn('Error al mostrar notificación:', error);
  }
}

// Compatibilidad con el código que ya utiliza esta función.
export async function notificarCambioEstado(
  pedido: Pedido
): Promise<void> {
  await notificarPedido(pedido, 'cliente', 'estado');
}

// Aviso interno: se dispara cuando el historial de un usuario cambia, para
// que la campana de la pantalla de inicio actualice el contador de no leídas.
type EscuchaHistorial = (usuarioId: string) => void;

const escuchasHistorial = new Set<EscuchaHistorial>();

export function suscribirHistorialNotificaciones(
  escucha: EscuchaHistorial,
): () => void {
  escuchasHistorial.add(escucha);
  return () => {
    escuchasHistorial.delete(escucha);
  };
}

export function avisarHistorialActualizado(usuarioId: string): void {
  escuchasHistorial.forEach((escucha) => {
    try {
      escucha(usuarioId);
    } catch {
      // Un(listener con error no puede romper el guardado del historial.
    }
  });
}

// Historial existente para cambios de estado del cliente.
export async function registrarCambioEstado(
  usuarioId: string,
  pedido: PedidoNotificable,
  evento: 'nuevo' | 'estado' | 'cancelado' = 'estado',
  onPermisoOtorgado?: () => void,
): Promise<void> {
  const preferencias = await storage.loadUserPreferences(usuarioId);

  if (preferencias?.notificaciones === false) return;

  const mensaje = obtenerMensajeNotificacion(pedido as Pedido, 'cliente');

  const notification = {
    id: `${pedido.id}:${pedido.estado}`,
    usuarioId,
    pedidoId: pedido.id,
    estado: pedido.estado,
    texto: mensaje.cuerpo,
    creadaEn: new Date().toISOString(),
    leida: false,
  };

  const added = await storage.appendNotification(
    usuarioId,
    notification
  );

  if (added) {
    await notificarPedido(pedido, 'cliente', evento, onPermisoOtorgado);
    avisarHistorialActualizado(usuarioId);
  }
}

// Aviso local para el negocio al recibir un pedido.
// No se ejecuta automáticamente: debe llamarse al detectar
// un pedido nuevo destinado a ese negocio.
export async function notificarNuevoPedidoNegocio(
  pedido: PedidoNotificable
): Promise<void> {
  await notificarPedido(pedido, 'negocio', 'nuevo');
}

// Aviso local para el negocio por cancelación.
export async function notificarCancelacionNegocio(
  pedido: PedidoNotificable
): Promise<void> {
  await notificarPedido(pedido, 'negocio', 'cancelado');
}
