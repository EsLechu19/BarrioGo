export type EstadoPedido = 'pendiente' | 'confirmado' | 'en_camino' | 'entregado';

export interface ItemPedido {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
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