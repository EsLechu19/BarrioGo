import { EstadoPago, EstadoPedido } from '../types/Pedido';
import { EstadoRepartidor } from '../types/Repartidor';

// Estados de pedido: color, etiqueta e icono en un solo lugar.
export type EstadoVisible = EstadoPedido | 'cancelado';

export type EstadoIcono =
  | 'time-outline'
  | 'checkmark-circle-outline'
  | 'bicycle-outline'
  | 'checkmark-done-outline'
  | 'close-circle-outline';

export const ESTADO_COLORS: Record<EstadoVisible, string> = {
  pendiente: '#F59E0B',
  confirmado: '#3B82F6',
  en_camino: '#8B5CF6',
  entregado: '#10B981',
  cancelado: '#EF4444',
};

export const ESTADO_LABELS: Record<EstadoVisible, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const ESTADO_ICONS = {
  pendiente: 'time-outline',
  confirmado: 'checkmark-circle-outline',
  en_camino: 'bicycle-outline',
  entregado: 'checkmark-done-outline',
  cancelado: 'close-circle-outline',
} satisfies Record<EstadoVisible, EstadoIcono>;

// Pago simulado (Fase 3): color, etiqueta e icono en un solo lugar.
export const ESTADO_PAGO_COLORS: Record<EstadoPago, string> = {
  pendiente: '#F59E0B',
  pagado: '#10B981',
  fallido: '#EF4444',
};

export const ESTADO_PAGO_LABELS: Record<EstadoPago, string> = {
  pendiente: 'Pago pendiente (se cobra al recibir)',
  pagado: 'Pago aprobado (simulado)',
  fallido: 'Pago rechazado (simulado)',
};

export type EstadoPagoIcono = 'wallet-outline' | 'checkmark-circle-outline' | 'close-circle-outline';

export const ESTADO_PAGO_ICONS = {
  pendiente: 'wallet-outline',
  pagado: 'checkmark-circle-outline',
  fallido: 'close-circle-outline',
} satisfies Record<EstadoPago, EstadoPagoIcono>;

// Flujo lineal del pedido: el negocio avanza al siguiente estado.
export const SIGUIENTE_ESTADO: Record<
  Exclude<EstadoPedido, 'entregado' | 'cancelado'>,
  EstadoPedido
> = {
  pendiente: 'confirmado',
  confirmado: 'en_camino',
  en_camino: 'entregado',
};

// Pasos del seguimiento (línea de progreso del detalle).
export const PASOS: (Exclude<EstadoPedido, 'cancelado'>)[] = [
  'pendiente',
  'confirmado',
  'en_camino',
  'entregado',
];

// Estados del repartidor: paleta y etiquetas compartidas por el panel
// Repartidores (colección `repartidores` gestionada desde el panel).
export const ESTADO_REPARTIDOR_COLOR: Record<EstadoRepartidor, string> = {
  en_ruta: '#8B5CF6',
  disponible: '#10B981',
  descanso: '#64748B',
};

export const ESTADO_REPARTIDOR_LABEL: Record<EstadoRepartidor, string> = {
  en_ruta: 'En ruta',
  disponible: 'Disponible',
  descanso: 'Descanso',
};
