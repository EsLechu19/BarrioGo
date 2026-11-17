// Opinión de un cliente. La lista de la app = Firestore + sesión + ejemplos
// (opinionesDemo). El rating se calcula SIEMPRE de esa lista combinada.
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
