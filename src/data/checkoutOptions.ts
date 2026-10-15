import type { DireccionEntrega, MetodoPago } from '../types/Checkout';

export const DIRECCIONES_DISPONIBLES: readonly DireccionEntrega[] = [
  { id: 'd1', alias: 'Casa', detalle: 'Av. Mi casa 123, Lima', esPrincipal: true },
  { id: 'd2', alias: 'Trabajo', detalle: 'Av. Arequipa 2450, Lima', esPrincipal: false },
];

export const METODOS_PAGO_DISPONIBLES: readonly MetodoPago[] = [
  { id: 'm1', nombre: 'Efectivo', detalle: 'Pago al recibir', tipo: 'efectivo' },
  { id: 'm2', nombre: 'Yape', detalle: '999 888 777', tipo: 'yape' },
  { id: 'm3', nombre: 'Visa •• 4321', detalle: 'Vence 08/28', tipo: 'tarjeta' },
];
