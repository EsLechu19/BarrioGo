import { Negocio } from '../types/Negocio';
import { Producto } from '../types/Producto';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
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
