import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { isSandboxPaymentConfigured } from '../config/env.js';
import { createMercadoPagoOrder } from './mercadoPagoClient.js';
import { updatePaymentFromOfficialOrder } from './webhookService.js';
import { text, validatePendingOrders } from './orderValidation.js';
import { releasePaymentReservation, reservePayment } from './paymentRepository.js';

export type PaymentCreationOutcome =
  | { kind: 'not_configured' }
  | { kind: 'email_verification_required' }
  | { kind: 'review_required' }
  | { kind: 'terminal'; paymentId: string; status: 'paid' | 'failed' }
  | { kind: 'checkout'; paymentId: string; status: string; checkoutUrl: string }
  | { kind: 'in_progress' }
  | { kind: 'provider_error'; outcome: 'rejected' | 'uncertain' }
  | { kind: 'created'; paymentId: string; checkoutUrl: string };

export async function createOrReusePayment(userId: string, verifiedEmail: string | undefined, pedidoIds: unknown): Promise<PaymentCreationOutcome> {
  if (!verifiedEmail) return { kind: 'email_verification_required' };
  if (!isSandboxPaymentConfigured()) return { kind: 'not_configured' };
  const validated = await validatePendingOrders(userId, pedidoIds);
  const { paymentId, paymentRef, payment, shouldCreate } = await reservePayment(userId, validated);

  if (payment.status === 'review_required') return { kind: 'review_required' };
  if (payment.status === 'paid' || payment.status === 'failed') {
    return { kind: 'terminal', paymentId, status: payment.status };
  }
  if (payment.checkoutUrl) return { kind: 'checkout', paymentId, status: payment.status, checkoutUrl: payment.checkoutUrl };
  if (!shouldCreate) return { kind: 'in_progress' };

  let mpResponse: Awaited<ReturnType<typeof fetch>>;
  try {
    mpResponse = await createMercadoPagoOrder(paymentId, payment.idempotencyKey, validated, verifiedEmail);
  } catch {
    await markPaymentForReview(paymentRef, 'uncertain_create_response');
    return { kind: 'provider_error', outcome: 'uncertain' };
  }
  if (!mpResponse.ok) {
    if ([400, 401, 403, 422].includes(mpResponse.status)) {
      await releasePaymentReservation(paymentRef, paymentId, payment.pedidoIds, 'creation_failed');
    } else {
      await markPaymentForReview(paymentRef, 'uncertain_create_response');
    }
    return { kind: 'provider_error', outcome: [400, 401, 403, 422].includes(mpResponse.status) ? 'rejected' : 'uncertain' };
  }

  let order: unknown;
  try {
    order = await mpResponse.json();
  } catch {
    await markPaymentForReview(paymentRef, 'malformed_create_response');
    return { kind: 'provider_error', outcome: 'uncertain' };
  }
  const providerOrder = order as { id?: unknown; checkout_url?: unknown } | null;
  const mpOrderId = text(providerOrder?.id);
  const checkoutUrl = text(providerOrder?.checkout_url);
  if (!mpOrderId || !checkoutUrl) {
    await markPaymentForReview(paymentRef, 'malformed_create_response');
    return { kind: 'provider_error', outcome: 'uncertain' };
  }

  await paymentRef.update({
    status: 'pending',
    mpOrderId,
    checkoutUrl,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { kind: 'created', paymentId, checkoutUrl };
}

async function markPaymentForReview(
  paymentRef: FirebaseFirestore.DocumentReference,
  providerStatus: 'uncertain_create_response' | 'malformed_create_response',
): Promise<void> {
  await paymentRef.update({
    status: 'review_required',
    providerStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function resumePendingPayment(userId: string, pedidoId: string) {
  const pedidoSnap = await db.collection('pedidos').doc(pedidoId).get();
  if (!pedidoSnap.exists || pedidoSnap.get('usuarioId') !== userId) {
    return { kind: 'not_found' } as const;
  }
  const pedido = pedidoSnap.data() as { estado: string; estadoPago?: string; metodoPago?: { tipo?: string }; pagoActivoId?: string };
  if (
    pedido.estado !== 'pendiente' || pedido.estadoPago !== 'pendiente' ||
    pedido.metodoPago?.tipo !== 'mercadopago_sandbox' || !pedido.pagoActivoId
  ) return { kind: 'not_resumable' } as const;

  const paymentSnap = await db.collection('pagos').doc(pedido.pagoActivoId).get();
  if (!paymentSnap.exists) return { kind: 'missing_payment' } as const;
  const payment = paymentSnap.data() as { usuarioId: string; pedidoIds: string[]; status: string; checkoutUrl?: string };
  if (
    payment.usuarioId !== userId || !payment.pedidoIds.includes(pedidoId) ||
    payment.status !== 'pending' || !payment.checkoutUrl
  ) return { kind: 'not_resumable' } as const;
  return { kind: 'resumed', paymentId: paymentSnap.id, status: payment.status, pedidoIds: payment.pedidoIds, checkoutUrl: payment.checkoutUrl } as const;
}

export async function readPaymentStatus(userId: string, paymentId: string) {
  const snap = await db.collection('pagos').doc(paymentId).get();
  if (!snap.exists || snap.data()?.usuarioId !== userId) return null;
  const data = snap.data() as { status: string; pedidoIds: string[]; checkoutUrl?: string };
  return {
    paymentId: snap.id,
    status: data.status,
    pedidoIds: data.pedidoIds,
    ...(data.status === 'pending' && data.checkoutUrl ? { checkoutUrl: data.checkoutUrl } : {}),
  };
}

export async function reconcilePendingPayment(userId: string, paymentId: string) {
  const paymentRef = db.collection('pagos').doc(paymentId);
  const paymentSnap = await paymentRef.get();
  if (!paymentSnap.exists || paymentSnap.data()?.usuarioId !== userId) return null;

  const payment = paymentSnap.data() as { status: string; mpOrderId?: string };
  if (payment.status === 'pending' && payment.mpOrderId) {
    await updatePaymentFromOfficialOrder(payment.mpOrderId, paymentId);
  }

  return readPaymentStatus(userId, paymentId);
}
