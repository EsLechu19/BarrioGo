import { negociosMock } from '../data/negociosMock';

// Nombre del negocio a partir de su id usando el catálogo local (mock).
// Devuelve un texto genérico si no lo encuentra.
export function nombreRestaurante(negocioId: string): string {
  return negociosMock.find((n) => n.id === negocioId)?.nombre ?? 'Restaurante';
}
