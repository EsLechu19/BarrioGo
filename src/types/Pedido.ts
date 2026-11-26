export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

// Estado del pago (simulado, sin dinero real):
// pendiente = se cobra al recibir; pagado = aprobado; fallido = declinado.
export type EstadoPago = 'pendiente' | 'pagado' | 'fallido';

export interface ItemPedido {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  // Snapshot del producto y del restaurante al agregarlo. Son opcionales para
  // que los carritos/pedidos creados antes de P0 sigan siendo legibles.
  negocioId?: string;
  // Nombre copiado al agregar, para no depender del catálogo al mostrar
  // (con Firestore los ids son aleatorios y se veían letras random).
  nombre?: string;
  descripcion?: string;
  imagen?: string;
  negocioNombre?: string;
  negocioImagen?: string;
}

export interface DireccionPedido {
  alias: string;
  detalle: string;
  lat?: number;
  lng?: number;
}

export interface MetodoPagoPedido {
  tipo: string;
  nombre: string;
}

export interface Pedido {
  id: string;
  usuarioId: string;
  negocioId: string;
  items: ItemPedido[];
  total: number;
  estado: EstadoPedido;
  fecha: string;
  canceladoPor?: string;
  canceladoFecha?: string;
  direccion?: DireccionPedido;
  metodoPago?: MetodoPagoPedido;
  // Snapshot del nombre del cliente al momento de confirmar el pedido.
  // Los pedidos viejos no lo tienen: el negocio muestra el UID recortado.
  clienteNombre?: string;
  // Nombre del negocio al confirmar: se muestra en la lista de pedidos
  // aunque el negocio no esté en el catálogo local.
  negocioNombre?: string;
  // Resultado del pago simulado al confirmar (Fase 3). Ausente = pedido
  // creado antes de la Fase 3: la app no muestra nada de pago.
  estadoPago?: EstadoPago;
  // Costo de envío cobrado (soles). Ausente = pedido sin envío cobrado.
  envio?: number;
}
