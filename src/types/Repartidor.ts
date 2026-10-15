// Repartidor del negocio (SOLO DISEÑO por ahora).
// TODO(back): colección `repartidores` en Firestore + invitación por código,
// y reemplazar REPARTIDORES_MOCK en NegocioScreen.
export type EstadoRepartidor = 'en_ruta' | 'disponible' | 'descanso';

export interface Repartidor {
  id: string;
  negocioId: string;
  nombre: string;
  estado: EstadoRepartidor;
  entregasHoy: number;
  telefono?: string;
}
