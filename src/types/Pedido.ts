import type { DireccionEntrega, MetodoPago } from './Checkout';

export type EstadoPedido = 'pendiente' | 'confirmado' | 'en_camino' | 'entregado';

export interface ItemPedido {
  productoId: string;
  // Snapshot del negocio para poder crear el pedido aunque el producto venga
  // de Firestore y no exista en el catálogo local.
  negocioId?: string;
  cantidad: number;
  precioUnitario: number;
  // Nombre al momento de agregar. El carrito lo guarda para no depender
  // del catálogo al mostrar (con Firestore los ids son aleatorios y el
  // mock local no los conoce → se veían letras random).
  nombre?: string;
}

export interface Pedido {
  id: string;
  usuarioId: string;
  negocioId: string;
  items: ItemPedido[];
  total: number;
  estado: EstadoPedido;
  fecha: string;
  // Optional so orders created before this work unit remain readable.
  direccionEntrega?: DireccionEntrega;
  metodoPago?: MetodoPago;
}
