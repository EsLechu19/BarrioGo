import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemPedido } from '../types/Pedido';

// Persistencia local tipada. REGLA: jamás confiar en JSON.parse a ciegas —
// todo lo leído se valida con un chequeo de forma antes de usarse.
const KEYS = {
  cart: 'barriogo:cart:v1',
  favorites: 'barriogo:favorites:v1',
  session: 'barriogo:session:v1',
} as const;

export interface Session {
  nombre: string;
  email: string;
}

function isItemPedidoArray(value: unknown): value is ItemPedido[] {
  return (
    Array.isArray(value) &&
    value.every(
      (i) =>
        typeof i === 'object' &&
        i !== null &&
        typeof (i as ItemPedido).productoId === 'string' &&
        typeof (i as ItemPedido).cantidad === 'number' &&
        typeof (i as ItemPedido).precioUnitario === 'number',
    )
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
};
