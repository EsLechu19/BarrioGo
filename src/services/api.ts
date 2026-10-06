import { Negocio } from '../types/Negocio';
import { Producto } from '../types/Producto';

// Toda llamada HTTP pasa por acá. Ninguna pantalla usa fetch directo.
// Intenta el API local (scripts/mock-server.js) y si está apagado o
// falla, usa el fallback local para que la demo nunca se caiga.
import { negociosMock } from '../data/negociosMock';
import { productosMock } from '../data/productosMock';

const MOCK_API_URL = 'http://localhost:3000/negocios';

export interface AppError {
  message: string;
  code: 'network' | 'server' | 'parse';
}

function isNegocioArray(value: unknown): value is Negocio[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Negocio).id === 'string' &&
        typeof (item as Negocio).nombre === 'string',
    )
  );
}

export async function getNegocios(): Promise<Negocio[]> {
  try {
    const response = await fetch(MOCK_API_URL);

    if (!response.ok) {
      // Servidor prendido pero respondió error -> fallback local
      return [...negociosMock];
    }

    const data: unknown = await response.json();

    if (!isNegocioArray(data)) {
      const err: AppError = { message: 'Respuesta del API con forma inválida', code: 'parse' };
      throw err;
    }

    return data;
  } catch {
    // Servidor apagado o sin red -> fallback local (demo a salvo)
    return [...negociosMock];
  }
}

export async function getNegocioById(id: string): Promise<Negocio | null> {
  const negocios = await getNegocios();
  return negocios.find((n) => n.id === id) ?? null;
}

// El menú vive en local en APF2 (misma forma que tendrá en Firestore
// en APF3). Se mantiene el delay para evidenciar loading en Detalle.
export async function getMenu(negocioId: string): Promise<Producto[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return productosMock.filter((p) => p.negocioId === negocioId);
}
