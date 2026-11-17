// Sede del negocio. Solo diseño: sin backend solo está el local principal.
// TODO(back): colección `locales` con duenioId para la sección Locales.
export interface Establecimiento {
  id: string;
  negocioId: string;
  nombre: string;
  direccion: string;
  esPrincipal: boolean;
  abierto: boolean;
}
