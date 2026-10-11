// Establecimiento / sede del negocio (SOLO DISEÑO por ahora).
// TODO(back): subcolección `negocios/{id}/locales` o colección `locales`
// con duenioId, y reemplazar LOCALES_MOCK en NegocioScreen.
export interface Establecimiento {
  id: string;
  negocioId: string;
  nombre: string;
  direccion: string;
  esPrincipal: boolean;
  abierto: boolean;
}
