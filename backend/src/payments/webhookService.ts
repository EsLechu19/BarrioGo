import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { cents, text } from './orderValidation.js';
import { getOfficialMercadoPagoOrder } from './mercadoPagoClient.js';
import type { PaymentData, PedidoWithPayment } from '../types/payment.js';

export async function updatePaymentFromOfficialOrder(orderId: string, expectedPaymentId?: string): Promise<void> {
  const order = await getOfficialMercadoPagoOrder(orderId);
  const paymentId = text(order.external_reference);
  if (!paymentId || order.id !== orderId || (expectedPaymentId && paymentId !== expectedPaymentId)) {
    throw new Error('Provider order is not linked to the expected payment.');
  }
  const paymentRef = db.collection('pagos').doc(paymentId);
  const orderAmount = cents(Number(order.total_amount));
  const paidAmount = cents(Number(order.total_paid_amount));
  await db.runTransaction(async (transaction) => {
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists) throw new Error('Payment record was not found.');
    const payment = paymentSnap.data() as PaymentData;
    if (payment.mpOrderId !== orderId || payment.amountCents !== orderAmount) throw new Error('Provider order amount or identity mismatch.');
    if (payment.status === 'paid' || payment.status === 'failed' || payment.status === 'review_required') return;
    const isProcessed = order.status === 'processed';
    const isPaid = isProcessed && paidAmount === payment.amountCents && order.currency === 'PEN';
    const isFailed = order.status === 'failed' || order.status === 'canceled';
    if (!isProcessed && !isFailed) return;
    const pedidoRefs = payment.pedidoIds.map((id) => db.collection('pedidos').doc(id));
    const pedidoSnaps = await Promise.all(pedidoRefs.map((ref) => transaction.get(ref)));
    const linkedOrdersEligible = pedidoSnaps.every((snap) => {
      const data = snap.data() as PedidoWithPayment | undefined;
      return snap.exists &&
        data?.usuarioId === payment.usuarioId &&
        data.estado === 'pendiente' &&
        data.estadoPago === 'pendiente' &&
        data.metodoPago?.tipo === 'mercadopago_sandbox' &&
        data.pagoActivoId === paymentId &&
        !data.canceladoPor;
    });
    const needsReview = !linkedOrdersEligible || (isProcessed && !isPaid);
    transaction.update(paymentRef, {
      status: needsReview ? 'review_required' : isPaid ? 'paid' : 'failed',
      providerStatus: order.status ?? 'unknown',
      ...(needsReview ? { reviewReason: linkedOrdersEligible ? 'provider_amount_or_currency_mismatch' : 'linked_order_not_eligible' } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    for (let index = 0; index < pedidoRefs.length; index += 1) {
      const snap = pedidoSnaps[index]!;
      if (snap.get('pagoActivoId') === paymentId) {
        transaction.update(pedidoRefs[index]!, {
          pagoActivoId: FieldValue.delete(),
          ...(!needsReview ? { estadoPago: isPaid ? 'pagado' : 'fallido' } : {}),
        });
      }
    }
  });
}
