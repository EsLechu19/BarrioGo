import { getFirebaseAuth } from './firebase';

const BACKEND_URL = process.env.EXPO_PUBLIC_MP_BACKEND_URL?.replace(/\/$/, '') ?? '';

export type MercadoPagoPaymentStatus = 'creating' | 'pending' | 'paid' | 'failed' | 'creation_failed' | 'review_required';

export interface MercadoPagoPayment {
  paymentId: string;
  status: MercadoPagoPaymentStatus;
  pedidoIds?: string[];
  checkoutUrl?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  AUTHENTICATION_REQUIRED: 'Inicia sesión para continuar con el pago.',
  INVALID_AUTHENTICATION: 'Tu sesión expiró. Inicia sesión y vuelve a intentarlo.',
  EMAIL_VERIFICATION_REQUIRED: 'Verifica el correo de tu cuenta antes de pagar con Mercado Pago.',
  PAYMENT_NOT_CONFIGURED: 'El pago de prueba no está disponible ahora. Inténtalo más tarde.',
  PAYMENT_REVIEW_REQUIRED: 'Este pago necesita revisión. No crees otro pedido; contacta al equipo de soporte.',
  PAYMENT_CREATION_IN_PROGRESS: 'El pago se está preparando. Espera un momento y consulta el pedido antes de reintentar.',
  PAYMENT_PROVIDER_REJECTED: 'Mercado Pago rechazó el inicio del pago. Tus pedidos siguen pendientes; no los repitas y contacta al equipo de soporte para reintentar el pago.',
  PAYMENT_PROVIDER_UNCERTAIN: 'No pudimos confirmar si el pago se inició. Tus pedidos siguen pendientes; no intentes pagarlos de nuevo y contacta al equipo de soporte.',
  ORDER_CONFLICT: 'Uno de tus pedidos ya cambió o está reservado por otro pago. Revisa su estado antes de continuar.',
  INVALID_PAYMENT_REQUEST: 'No se pudo iniciar el pago porque los datos del pedido no son válidos. Revisa tus pedidos y vuelve a intentarlo.',
  INVALID_ORDER_IDENTIFIER: 'El identificador del pedido no es válido.',
  ORDER_NOT_FOUND: 'No encontramos ese pedido en tu cuenta.',
  PAYMENT_NOT_RESUMABLE: 'No hay un pago pendiente para retomar. Revisa el estado del pedido antes de volver a intentarlo.',
  PAYMENT_RECORD_MISSING: 'No encontramos el registro del pago. Contacta al equipo de soporte antes de reintentar.',
  PAYMENT_RESUME_FAILED: 'No se pudo retomar el pago. Inténtalo de nuevo más tarde.',
  PAYMENT_NOT_FOUND: 'No encontramos ese pago en tu cuenta.',
  PAYMENT_STATUS_UNAVAILABLE: 'No se pudo consultar el pago. Inténtalo de nuevo más tarde.',
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BACKEND_URL || !/^https:\/\//i.test(BACKEND_URL)) {
    throw new Error('El backend HTTPS de pagos de prueba no está configurado.');
  }
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Iniciá sesión para pagar con Mercado Pago.');
  const token = await user.getIdToken();
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  } catch {
    throw new Error('No hay conexión con el servicio de pago. Revisa internet y consulta el pedido antes de reintentar.');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : '';
    const message = ERROR_MESSAGES[code] ?? 'No se pudo completar la operación de pago. Consulta el estado del pedido antes de reintentar.';
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

export function verificarElegibilidadMercadoPago(): Promise<{ eligible: true }> {
  return request<{ eligible: true }>('/api/payments/eligibility');
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
