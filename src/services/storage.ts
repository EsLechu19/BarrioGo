import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemPedido } from '../types/Pedido';
import type { Notificacion } from '../types/Notificacion';
import type { PerfilUsuario, PreferenciasUsuario } from '../types/Usuario';

// Persistencia local tipada. REGLA: jamás confiar en JSON.parse a ciegas —
// todo lo leído se valida con un chequeo de forma antes de usarse.
const KEYS = {
  cart: 'barriogo:cart:v1',
  favorites: 'barriogo:favorites:v1',
  session: 'barriogo:session:v1',
  // Preferencia de tema: misma clave que el lab del curso (@prefs/theme),
  // guardada como string 'dark' | 'light' (nunca como boolean).
  theme: '@prefs/theme',
} as const;

function notificationsKey(usuarioId: string): string {
  return `barriogo:notifications:v1:${encodeURIComponent(usuarioId)}`;
}

function profileKey(usuarioId: string): string {
  return `barriogo:profile:v1:${encodeURIComponent(usuarioId)}`;
}

function preferencesKey(usuarioId: string): string {
  return `barriogo:preferences:v1:${encodeURIComponent(usuarioId)}`;
}

export interface Session {
  nombre: string;
  email: string;
}

function isItemPedidoArray(value: unknown): value is ItemPedido[] {
  return (
    Array.isArray(value) &&
    value.every((i) => {
      if (typeof i !== 'object' || i === null) return false;
      const item = i as ItemPedido;
      return (
        typeof item.productoId === 'string' &&
        Number.isFinite(item.cantidad) &&
        item.cantidad > 0 &&
        Number.isFinite(item.precioUnitario) &&
        item.precioUnitario >= 0 &&
        (item.negocioId === undefined ||
          (typeof item.negocioId === 'string' && item.negocioId.trim().length > 0))
      );
    })
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isSession(value: unknown): value is Session {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Session).nombre === 'string' &&
    typeof (value as Session).email === 'string'
  );
}

function isNotificacion(value: unknown): value is Notificacion {
  if (typeof value !== 'object' || value === null) return false;
  const n = value as Notificacion;
  return (
    typeof n.id === 'string' &&
    typeof n.usuarioId === 'string' &&
    typeof n.pedidoId === 'string' &&
    typeof n.estado === 'string' &&
    ['pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado'].includes(n.estado) &&
    typeof n.texto === 'string' &&
    typeof n.creadaEn === 'string' &&
    typeof n.leida === 'boolean'
  );
}

function isNotificacionArray(value: unknown): value is Notificacion[] {
  return Array.isArray(value) && value.every(isNotificacion);
}

function isPerfilUsuario(value: unknown): value is PerfilUsuario {
  return typeof value === 'object' && value !== null &&
    typeof (value as PerfilUsuario).telefono === 'string';
}

function isPreferenciasUsuario(value: unknown): value is PreferenciasUsuario {
  return typeof value === 'object' && value !== null &&
    typeof (value as PreferenciasUsuario).notificaciones === 'boolean' &&
    typeof (value as PreferenciasUsuario).ubicacion === 'boolean' &&
    typeof (value as PreferenciasUsuario).ofertas === 'boolean';
}

const notificationWrites = new Map<string, Promise<void>>();

async function readNotifications(usuarioId: string): Promise<Notificacion[]> {
  const raw = await AsyncStorage.getItem(notificationsKey(usuarioId));
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  return isNotificacionArray(parsed)
    ? parsed.filter((notification) => notification.usuarioId === usuarioId)
    : [];
}

async function writeNotifications(
  usuarioId: string,
  notifications: Notificacion[],
): Promise<void> {
  await AsyncStorage.setItem(notificationsKey(usuarioId), JSON.stringify(notifications));
}

function enqueueNotificationWrite<T>(
  usuarioId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previous: Promise<void> = notificationWrites.get(usuarioId) ?? Promise.resolve();
  const current: Promise<T> = previous.then(operation);
  notificationWrites.set(
    usuarioId,
    current.then(() => undefined, () => undefined),
  );
  return current;
}

async function read<T>(key: string, guard: (v: unknown) => v is T): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Disco lleno o storage no disponible: la app sigue en memoria.
    console.log('No se pudo persistir', key);
  }
}

export const storage = {
  loadCart: () => read(KEYS.cart, isItemPedidoArray),
  saveCart: (items: ItemPedido[]) => write(KEYS.cart, items),
  loadFavorites: () => read(KEYS.favorites, isStringArray),
  saveFavorites: (ids: string[]) => write(KEYS.favorites, ids),
  loadSession: () => read(KEYS.session, isSession),
  saveSession: (s: Session) => write(KEYS.session, s),
  clearSession: () => AsyncStorage.removeItem(KEYS.session),
  // Tema: se guarda como 'dark' | 'light'; al leer se valida el valor.
  loadTheme: async (): Promise<'dark' | 'light' | null> => {
    try {
      const valor = await AsyncStorage.getItem(KEYS.theme);
      return valor === 'dark' || valor === 'light' ? valor : null;
    } catch {
      return null;
    }
  },
  saveTheme: (tema: 'dark' | 'light') => write(KEYS.theme, tema),
  loadUserProfile: (usuarioId: string): Promise<PerfilUsuario | null> =>
    usuarioId.trim() ? read(profileKey(usuarioId), isPerfilUsuario) : Promise.resolve(null),
  saveUserProfile: (usuarioId: string, profile: PerfilUsuario): Promise<void> =>
    usuarioId.trim() ? write(profileKey(usuarioId), profile) : Promise.resolve(),
  loadUserPreferences: (usuarioId: string): Promise<PreferenciasUsuario | null> =>
    usuarioId.trim()
      ? read(preferencesKey(usuarioId), isPreferenciasUsuario)
      : Promise.resolve(null),
  saveUserPreferences: (
    usuarioId: string,
    preferences: PreferenciasUsuario,
  ): Promise<void> =>
    usuarioId.trim()
      ? write(preferencesKey(usuarioId), preferences)
      : Promise.resolve(),
  loadNotifications: (usuarioId: string): Promise<Notificacion[]> => {
    if (!usuarioId.trim()) return Promise.resolve([]);
    return readNotifications(usuarioId);
  },
  appendNotification: (
    usuarioId: string,
    notification: Notificacion,
  ): Promise<boolean> => {
    if (!usuarioId.trim() || notification.usuarioId !== usuarioId) {
      return Promise.resolve(false);
    }
    return enqueueNotificationWrite(usuarioId, async () => {
      const existing = await readNotifications(usuarioId);
      const duplicate = existing.some(
        (item) => item.pedidoId === notification.pedidoId && item.estado === notification.estado,
      );
      if (duplicate) return false;
      await writeNotifications(usuarioId, [notification, ...existing]);
      return true;
    });
  },
};
