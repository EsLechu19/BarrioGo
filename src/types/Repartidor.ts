// Repartidor del negocio: colección `repartidores` (gestión en el panel).
// TODO(back): asignar a un pedido + invitación por código.
export type EstadoRepartidor = 'en_ruta' | 'disponible' | 'descanso';

export interface Repartidor {
  id: string;
  negocioId: string;
  nombre: string;
  estado: EstadoRepartidor;
  entregasHoy: number;
  telefono?: string;
}
