export interface DireccionEntrega {
  id: string;
  alias: string;
  detalle: string;
  esPrincipal: boolean;
}

export type TipoMetodoPago = 'efectivo' | 'yape' | 'tarjeta';

export interface MetodoPago {
  id: string;
  nombre: string;
  detalle: string;
  tipo: TipoMetodoPago;
}
