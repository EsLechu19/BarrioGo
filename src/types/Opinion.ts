// Opinión de un cliente sobre un negocio (SOLO DISEÑO por ahora).
// TODO(back): crear colección `opiniones` en Firestore + `crearOpinion` y
// `escucharOpiniones` en src/services/api.ts, y reemplazar OPINIONES_MOCK.
export type Estrellas = 1 | 2 | 3 | 4 | 5;

export interface Opinion {
  id: string;
  negocioId: string;
  usuarioId: string;
  nombre: string;
  estrellas: Estrellas;
  texto: string;
  fecha: string;
}

export function esEstrellas(value: unknown): value is Estrellas {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

export const MAX_TEXTO_OPINION = 280;
