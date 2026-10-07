import { Negocio } from '../types/Negocio';
import { Producto } from '../types/Producto';
import { EstadoPedido, ItemPedido, Pedido } from '../types/Pedido';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { firebaseReady, getFirestoreDb } from './firebase';

// Toda lectura de datos pasa por acá. Ninguna pantalla usa fetch ni
// Firestore directo. Cadena de orígenes (el primero que responde gana):
//   1. Firestore (datos reales, necesita reglas publicadas + seed)
//   2. API local (scripts/mock-server.js, `npm run mock-api`)
//   3. Fallback local (demo a salvo, sin red)
import { negociosMock } from '../data/negociosMock';
import { productosMock } from '../data/productosMock';

const MOCK_API_URL = 'http://localhost:3000/negocios';

export interface AppError {
  message: string;
  code: 'network' | 'server' | 'parse';
}

function isNegocio(value: unknown): value is Negocio {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Negocio).id === 'string' &&
    typeof (value as Negocio).nombre === 'string'
  );
}

function isNegocioArray(value: unknown): value is Negocio[] {
  return Array.isArray(value) && value.every(isNegocio);
}

function isProductoArray(value: unknown): value is Producto[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Producto).id === 'string' &&
        typeof (item as Producto).negocioId === 'string',
    )
  );
}

async function getNegociosFromMockServer(): Promise<Negocio[] | null> {
  try {
    const response = await fetch(MOCK_API_URL);
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return isNegocioArray(data) && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

export async function getNegocios(): Promise<Negocio[]> {
  // 1. Firestore
  if (firebaseReady) {
    try {
      const snap = await getDocs(collection(getFirestoreDb(), 'negocios'));
      const data: unknown = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (isNegocioArray(data) && data.length > 0) return data;
    } catch {
      // cae al siguiente origen
    }
  }
  // 2. API local
  const mock = await getNegociosFromMockServer();
  if (mock) return mock;
  // 3. Fallback local
  return [...negociosMock];
}

export async function getNegocioById(id: string): Promise<Negocio | null> {
  if (firebaseReady) {
    try {
      const snap = await getDoc(doc(getFirestoreDb(), 'negocios', id));
      const data: unknown = snap.exists()
        ? { id: snap.id, ...snap.data() }
        : null;
      if (data && isNegocio(data)) return data;
    } catch {
      // cae al siguiente origen
    }
  }
  const negocios = await getNegocios();
  return negocios.find((n) => n.id === id) ?? null;
}

export async function getMenu(negocioId: string): Promise<Producto[]> {
  if (firebaseReady) {
    try {
      const q = query(
        collection(getFirestoreDb(), 'productos'),
        where('negocioId', '==', negocioId),
      );
      const snap = await getDocs(q);
      const data: unknown = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (isProductoArray(data) && data.length > 0) return data;
    } catch {
      // cae al fallback local
    }
  } else {
    // Sin Firebase, delay para evidenciar loading en Detalle.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return productosMock.filter((p) => p.negocioId === negocioId);
}

// ---------- F3 Pedidos con tracking ----------

const FIREBASE_NO_CONFIG_MSG =
  'Firebase no configurado: falta el .env (ver .env.example)';

export interface CrearPedidoInput {
  usuarioId: string;
  negocioId: string;
  items: ItemPedido[];
  total: number;
}

const ESTADOS_PEDIDO: readonly EstadoPedido[] = [
  'pendiente',
  'confirmado',
  'en_camino',
  'entregado',
];

function isEstadoPedido(value: unknown): value is EstadoPedido {
  return (
    typeof value === 'string' &&
    (ESTADOS_PEDIDO as readonly string[]).includes(value)
  );
}

function isItemPedido(value: unknown): value is ItemPedido {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ItemPedido).productoId === 'string' &&
    typeof (value as ItemPedido).cantidad === 'number' &&
    typeof (value as ItemPedido).precioUnitario === 'number'
  );
}

function isPedido(value: unknown): value is Pedido {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Pedido;
  return (
    typeof p.id === 'string' &&
    typeof p.usuarioId === 'string' &&
    typeof p.negocioId === 'string' &&
    Array.isArray(p.items) &&
    p.items.every(isItemPedido) &&
    typeof p.total === 'number' &&
    isEstadoPedido(p.estado) &&
    typeof p.fecha === 'string'
  );
}

export async function crearPedido(input: CrearPedidoInput): Promise<string> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!input.usuarioId.trim()) throw new Error('Falta el usuario del pedido.');
  if (!input.negocioId.trim()) throw new Error('Falta el negocio del pedido.');
  if (input.items.length === 0) throw new Error('El pedido no tiene productos.');
  if (!(input.total > 0)) throw new Error('El total del pedido no es válido.');
  try {
    const ref = await addDoc(collection(getFirestoreDb(), 'pedidos'), {
      usuarioId: input.usuarioId,
      negocioId: input.negocioId,
      items: input.items,
      total: input.total,
      estado: 'pendiente',
      fecha: new Date().toISOString(),
    });
    return ref.id;
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo crear el pedido: ${e.message}`
        : 'No se pudo crear el pedido. Intentá de nuevo.',
    );
  }
}

export function escucharMisPedidos(
  usuarioId: string,
  cb: (pedidos: Pedido[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!firebaseReady) return () => {};
  if (!usuarioId.trim()) return () => {};
  try {
    // Sin orderBy a propósito: where + orderBy exige índice compuesto en
    // Firestore y rompía la demo. Ordenamos en memoria (fecha desc).
    const q = query(
      collection(getFirestoreDb(), 'pedidos'),
      where('usuarioId', '==', usuarioId),
    );
    return onSnapshot(
      q,
      (snap) => {
        try {
          const data: unknown = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          const pedidos: Pedido[] = Array.isArray(data)
            ? data.filter(isPedido).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
            : [];
          cb(pedidos);
        } catch (e) {
          onError?.(
            e instanceof Error
              ? e
              : new Error('No se pudieron leer tus pedidos.'),
          );
        }
      },
      (err: Error) => {
        onError?.(
          err instanceof Error
            ? err
            : new Error('Se perdió la conexión con tus pedidos.'),
        );
      },
    );
  } catch (e) {
    onError?.(
      e instanceof Error
        ? e
        : new Error('No se pudo escuchar tus pedidos.'),
    );
    return () => {};
  }
}

// ---------- F4 Panel negocio ----------

export function escucharPedidosNegocio(
  negocioId: string,
  cb: (pedidos: Pedido[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  if (!firebaseReady) return () => {};
  if (!negocioId.trim()) return () => {};
  try {
    // Sin orderBy a propósito (igual que F3): where + orderBy exige índice
    // compuesto en Firestore. Ordenamos en memoria (fecha desc).
    const q = query(
      collection(getFirestoreDb(), 'pedidos'),
      where('negocioId', '==', negocioId),
    );
    return onSnapshot(
      q,
      (snap) => {
        try {
          const data: unknown = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          const pedidos: Pedido[] = Array.isArray(data)
            ? data.filter(isPedido).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
            : [];
          cb(pedidos);
        } catch (e) {
          onError?.(
            e instanceof Error
              ? e
              : new Error('No se pudieron leer los pedidos del negocio.'),
          );
        }
      },
      (err: Error) => {
        onError?.(
          err instanceof Error
            ? err
            : new Error('Se perdió la conexión con los pedidos del negocio.'),
        );
      },
    );
  } catch (e) {
    onError?.(
      e instanceof Error
        ? e
        : new Error('No se pudo escuchar los pedidos del negocio.'),
    );
    return () => {};
  }
}

export async function cambiarEstadoPedido(
  pedidoId: string,
  estado: EstadoPedido,
): Promise<void> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!pedidoId.trim()) throw new Error('Falta el id del pedido.');
  if (!isEstadoPedido(estado)) throw new Error('El estado del pedido no es válido.');
  try {
    await updateDoc(doc(getFirestoreDb(), 'pedidos', pedidoId), { estado });
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo cambiar el estado del pedido: ${e.message}`
        : 'No se pudo cambiar el estado del pedido. Intentá de nuevo.',
    );
  }
}

export interface CrearProductoInput {
  negocioId: string;
  nombre: string;
  precio: number;
  descripcion?: string;
}

export async function crearProducto(input: CrearProductoInput): Promise<string> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!input.negocioId.trim()) throw new Error('Falta el negocio del producto.');
  if (!input.nombre.trim()) throw new Error('El producto necesita un nombre.');
  if (!(input.precio > 0)) throw new Error('El precio debe ser mayor a 0.');
  try {
    const ref = await addDoc(collection(getFirestoreDb(), 'productos'), {
      negocioId: input.negocioId,
      nombre: input.nombre.trim(),
      precio: input.precio,
      descripcion: input.descripcion?.trim() ?? '',
      imagenUrl: '',
      disponible: true,
    });
    return ref.id;
    } catch (e) {
      throw new Error(
        e instanceof Error
          ? `No se pudo crear el producto: ${e.message}`
          : 'No se pudo crear el producto. Intentá de nuevo.',
      );
    }
  }

// ---------- F6 Negocio propio por cuenta (S1 Registro + vínculo) ----------

export interface RegistrarNegocioInput {
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  lat: number;
  lng: number;
}

export async function registrarNegocio(
  input: RegistrarNegocioInput,
): Promise<string> {
  if (!firebaseReady) throw new Error(FIREBASE_NO_CONFIG_MSG);
  if (!input.usuarioId.trim()) throw new Error('Falta el usuario del negocio.');
  if (!input.nombre.trim()) throw new Error('El negocio necesita un nombre.');
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    throw new Error('La ubicación del negocio no es válida.');
  }
  let negocioId: string;
  try {
    const ref = await addDoc(collection(getFirestoreDb(), 'negocios'), {
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() ?? '',
      direccion: input.direccion?.trim() ?? '',
      imagen: '',
      rating: 0,
      opiniones: 0,
      tiempoEstimado: '',
      distancia: '',
      envioGratis: false,
      lat: input.lat,
      lng: input.lng,
      dueñoId: input.usuarioId,
    });
    negocioId = ref.id;
  } catch (e) {
    throw new Error(
      e instanceof Error
        ? `No se pudo registrar el negocio: ${e.message}`
        : 'No se pudo registrar el negocio. Intentá de nuevo.',
    );
  }
  try {
    await setDoc(
      doc(getFirestoreDb(), 'users', input.usuarioId),
      { rol: 'negocio', negocioId },
      { merge: true },
    );
  } catch (e) {
    const detalle: string =
      e instanceof Error ? e.message : 'error desconocido';
    throw new Error(
      `El negocio se creó (id ${negocioId}) pero no se pudo vincular a tu cuenta: ${detalle}. Pedí al equipo que en users/${input.usuarioId} ponga negocioId:'${negocioId}' y rol:'negocio'.`,
    );
  }
  return negocioId;
}
