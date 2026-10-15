// Dirección guardada del usuario (cliente). Vive en el listado de la
// pantalla Direcciones y define cuál es la de entrega activa del checkout.
export interface DireccionUsuario {
  id: string;
  alias: string;
  detalle: string;
  esPrincipal: boolean;
}
