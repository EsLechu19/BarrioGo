export type EstadoPedido = 'pendiente' | 'confirmado' | 'en_camino' | 'entregado';

export interface ItemPedido {
  productoId: string;
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
}