export type EstadoPedido = 'pendiente' | 'confirmado' | 'en_camino' | 'entregado';

export interface ItemPedido {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  // Snapshot del producto y del restaurante al agregarlo. Son opcionales para
  // que los carritos/pedidos creados antes de P0 sigan siendo legibles.
  negocioId?: string;
  // Nombre al momento de agregar. El carrito lo guarda para no depender
  // del catálogo al mostrar (con Firestore los ids son aleatorios y el
  // mock local no los conoce → se veían letras random).
  nombre?: string;
  descripcion?: string;
  imagen?: string;
  negocioNombre?: string;
  negocioImagen?: string;
}

export interface DireccionPedido {
  alias: string;
  detalle: string;
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
  direccion?: DireccionPedido;
  metodoPago?: MetodoPagoPedido;
}
