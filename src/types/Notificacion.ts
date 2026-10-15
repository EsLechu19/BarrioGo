import type { EstadoPedido } from './Pedido';

export interface Notificacion {
  id: string;
  usuarioId: string;
  pedidoId: string;
  estado: EstadoPedido;
  texto: string;
  creadaEn: string;
  leida: boolean;
}
