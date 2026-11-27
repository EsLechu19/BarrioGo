import { Router, type Response } from 'express';
import { text } from '../payments/orderValidation.js';
import { updatePaymentFromOfficialOrder } from '../payments/webhookService.js';
import { validateWebhookSignature } from '../payments/webhookSignature.js';

function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ error: message });
}

export const webhooksRouter = Router();

webhooksRouter.post('/mercadopago', async (req, res) => {
  const signatureResult = validateWebhookSignature(req);
  if (!signatureResult.valid) {
    console.warn('Rejected Mercado Pago webhook signature', {
      reason: signatureResult.reason,
      ...signatureResult.diagnostics,
    });
    sendError(res, 401, 'Invalid webhook signature.');
    return;
  }
  const type = text(req.query.type) ?? text((req.body as { type?: unknown } | undefined)?.type);
  if (type && !['order', 'orders', 'orders_v2'].includes(type)) {
    res.sendStatus(200);
    return;
  }
  const orderId = text(req.query['data.id']) ?? text((req.body as { data?: { id?: unknown } } | undefined)?.data?.id);
  if (!orderId) {
    sendError(res, 400, 'Missing order identifier.');
    return;
  }
  try {
    await updatePaymentFromOfficialOrder(orderId);
    res.sendStatus(200);
  } catch {
    sendError(res, 502, 'Webhook could not be reconciled.');
  }
});
