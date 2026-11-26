import { getFirebaseAuth } from './firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_MP_BACKEND_URL?.replace(/\/$/, '') ?? '';

export type MercadoPagoPaymentStatus = 'creating' | 'pending' | 'paid' | 'failed' | 'creation_failed' | 'review_required';

export interface MercadoPagoPayment {
  paymentId: string;
  status: MercadoPagoPaymentStatus;
  pedidoIds?: string[];
  checkoutUrl?: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BACKEND_URL || !/^https:\/\//i.test(BACKEND_URL)) {
    throw new Error('El backend HTTPS de pagos de prueba no está configurado.');
  }
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Iniciá sesión para pagar con Mercado Pago.');
  const token = await user.getIdToken();
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : 'No se pudo consultar el pago de prueba.';
    throw new Error(message);
  }
  return body as T;
}

export function crearPagoMercadoPago(pedidoIds: string[]): Promise<MercadoPagoPayment> {
  return request<MercadoPagoPayment>('/api/payments', {
    method: 'POST',
    body: JSON.stringify({ pedidoIds }),
  });
}

export function consultarPagoMercadoPago(paymentId: string): Promise<MercadoPagoPayment> {
  if (!/^[a-f0-9]{64}$/.test(paymentId)) {
    throw new Error('El identificador del pago no es válido.');
  }
  return request<MercadoPagoPayment>(`/api/payments/${encodeURIComponent(paymentId)}`);
}

export function consultarPagoPedidoMercadoPago(pedidoId: string): Promise<MercadoPagoPayment> {
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(pedidoId)) {
    throw new Error('El identificador del pedido no es válido.');
  }
  return request<MercadoPagoPayment>(`/api/payments/order/${encodeURIComponent(pedidoId)}`);
}
