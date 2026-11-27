import { runtimeEnv } from '../config/env.js';
import type { MpOrder, ValidatedOrders } from '../types/payment.js';

export async function createMercadoPagoOrder(
  paymentId: string,
  idempotencyKey: string,
  validated: ValidatedOrders,
  verifiedPayerEmail: string,
): Promise<Response> {
  const publicUrl = runtimeEnv.publicBackendUrl!;
  const returnUrl = `${publicUrl}/checkout-return?paymentId=${encodeURIComponent(paymentId)}`;
  return fetch('https://api.mercadopago.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${runtimeEnv.mercadoPagoAccessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      type: 'online',
      processing_mode: 'manual',
      total_amount: (validated.totalCents / 100).toFixed(2),
      external_reference: paymentId,
      items: validated.mpItems,
      payer: { email: verifiedPayerEmail },
      config: { online: { success_url: returnUrl, failure_url: returnUrl, pending_url: returnUrl, auto_return: 'all' } },
    }),
  });
}

export async function getOfficialMercadoPagoOrder(orderId: string): Promise<MpOrder> {
  if (!runtimeEnv.mercadoPagoAccessToken?.startsWith('TEST-')) throw new Error('Test payment provider is not configured.');
  const response = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${runtimeEnv.mercadoPagoAccessToken}` },
  });
  if (!response.ok) throw new Error('Could not confirm the provider order state.');
  return await response.json() as MpOrder;
}
