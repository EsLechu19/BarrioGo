import crypto from 'node:crypto';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import type { PaymentData, PedidoWithPayment, ValidatedOrders } from '../types/payment.js';

export interface PaymentReservation {
  paymentId: string;
  paymentRef: DocumentReference;
  payment: PaymentData;
  shouldCreate: boolean;
}

export async function reservePayment(userId: string, validated: ValidatedOrders): Promise<PaymentReservation> {
  const stableIds = [...validated.ids].sort();
  const paymentId = crypto.createHash('sha256').update(`${userId}:${stableIds.join(',')}`).digest('hex');
  const paymentRef = db.collection('pagos').doc(paymentId);
  const pedidoRefs = stableIds.map((id) => db.collection('pedidos').doc(id));
  const idempotencyKey = crypto.createHash('sha256').update(`barriogo:${paymentId}`).digest('hex');
  let payment: PaymentData;
  let shouldCreate = false;

  await db.runTransaction(async (transaction) => {
    shouldCreate = false;
    const current = await transaction.get(paymentRef);
    const pedidoSnaps = await Promise.all(pedidoRefs.map((ref) => transaction.get(ref)));
    for (const snap of pedidoSnaps) {
      if (!snap.exists) throw new Error('An order was not found.');
      const data = snap.data() as PedidoWithPayment;
      if (
        data.usuarioId !== userId || data.estado !== 'pendiente' || data.estadoPago !== 'pendiente' ||
        data.metodoPago?.tipo !== 'mercadopago_sandbox'
      ) {
        throw new Error('All orders must belong to you and still be pending.');
      }
      if (data.pagoActivoId && data.pagoActivoId !== paymentId) {
        throw new Error('An order is already reserved by another payment.');
      }
    }
    if (current.exists) {
      payment = current.data() as PaymentData;
      if (payment.usuarioId !== userId || payment.pedidoIds.join(',') !== stableIds.join(',')) {
        throw new Error('Payment reference conflict.');
      }
      if (payment.status === 'paid' || payment.status === 'failed' || payment.status === 'review_required') return;
      if (payment.checkoutUrl) {
        for (const ref of pedidoRefs) transaction.update(ref, { pagoActivoId: paymentId });
        return;
      }
      const updatedAt = current.get('updatedAt') as { toMillis?: () => number } | undefined;
      const lastAttempt = updatedAt?.toMillis?.() ?? 0;
      if (payment.status === 'creating' && Date.now() - lastAttempt < 120_000) return;
      transaction.update(paymentRef, {
        amountCents: validated.totalCents,
        status: 'creating',
        updatedAt: FieldValue.serverTimestamp(),
      });
      for (const ref of pedidoRefs) transaction.update(ref, { pagoActivoId: paymentId });
      shouldCreate = true;
      return;
    }
    payment = {
      usuarioId: userId,
      pedidoIds: stableIds,
      status: 'creating',
      amountCents: validated.totalCents,
      idempotencyKey,
    };
    transaction.create(paymentRef, {
      ...payment,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    for (const ref of pedidoRefs) transaction.update(ref, { pagoActivoId: paymentId });
    shouldCreate = true;
  });

  const saved = await paymentRef.get();
  payment = saved.data() as PaymentData;
  return { paymentId, paymentRef, payment, shouldCreate };
}

export async function releasePaymentReservation(
  paymentRef: DocumentReference,
  paymentId: string,
  pedidoIds: string[],
  status: 'creation_failed',
): Promise<void> {
  const pedidoRefs = pedidoIds.map((id) => db.collection('pedidos').doc(id));
  await db.runTransaction(async (transaction) => {
    const paymentSnap = await transaction.get(paymentRef);
    const pedidoSnaps = await Promise.all(pedidoRefs.map((ref) => transaction.get(ref)));
    if (!paymentSnap.exists || (paymentSnap.data() as PaymentData).status !== 'creating') return;
    transaction.update(paymentRef, {
      status,
      mpOrderId: FieldValue.delete(),
      checkoutUrl: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    for (let index = 0; index < pedidoRefs.length; index += 1) {
      if (pedidoSnaps[index]?.get('pagoActivoId') === paymentId) {
        transaction.update(pedidoRefs[index]!, { pagoActivoId: FieldValue.delete() });
      }
    }
  });
}
