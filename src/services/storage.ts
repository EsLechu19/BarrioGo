import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemPedido } from '../types/Pedido';

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
};
