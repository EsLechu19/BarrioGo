import type { Request } from 'express';

export interface PedidoItem {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  nombre?: string;
}

export interface PedidoData {
  usuarioId: string;
  negocioId: string;
  items: PedidoItem[];
  total: number;
  estado: string;
  estadoPago?: string;
  envio?: number;
  metodoPago?: { tipo?: string; nombre?: string };
}

export interface PaymentData {
  usuarioId: string;
  pedidoIds: string[];
  status: 'creating' | 'pending' | 'paid' | 'failed' | 'creation_failed' | 'review_required';
  amountCents: number;
  mpOrderId?: string;
  checkoutUrl?: string;
  idempotencyKey: string;
}

export interface MpOrder {
  id?: string;
  external_reference?: string;
  status?: string;
  total_amount?: string;
  total_paid_amount?: string;
  currency?: string;
  checkout_url?: string;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export interface PedidoWithPayment extends PedidoData {
  pagoActivoId?: string;
  canceladoPor?: string;
}

export interface ValidatedOrders {
  ids: string[];
  totalCents: number;
  mpItems: { title: string; quantity: number; unit_price: string }[];
}
