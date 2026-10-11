import type { User } from 'firebase/auth';

// Nombre a mostrar del usuario: displayName, si no la parte del correo, si no
// el fallback. Siempre capitalizado (primera letra en mayúscula).
export function nombreVisible(user: User | null, fallback = 'Vecino'): string {
  const base: string =
    user?.displayName?.trim() || user?.email?.split('@')[0] || fallback;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Inicial para avatares (opiniones, perfil). Vacío → fallback.
export function inicialDe(nombre: string, fallback = 'V'): string {
  return nombre.trim().charAt(0).toUpperCase() || fallback;
}
