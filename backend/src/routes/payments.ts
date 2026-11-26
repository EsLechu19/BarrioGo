import { Router, type Response as ExpressResponse } from 'express';
import { requireFirebaseUser } from '../middleware/requireFirebaseUser.js';
import { text } from '../payments/orderValidation.js';
import { createOrReusePayment, readPaymentStatus, resumePendingPayment } from '../payments/paymentService.js';
import type { AuthenticatedRequest } from '../types/payment.js';

function sendError(res: ExpressResponse, status: number, message: string): void {
  res.status(status).json({ error: message });
}

export const paymentsRouter = Router();

paymentsRouter.post('/', requireFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const outcome = await createOrReusePayment(req.userId!, req.body?.pedidoIds);
    switch (outcome.kind) {
      case 'not_configured':
        sendError(res, 503, 'Payment service is not configured for HTTPS sandbox use.');
        return;
      case 'review_required':
        sendError(res, 409, 'Payment requires support review before it can be reopened.');
        return;
      case 'terminal':
        res.json({ paymentId: outcome.paymentId, status: outcome.status });
        return;
      case 'checkout':
        res.json({ paymentId: outcome.paymentId, status: outcome.status, checkoutUrl: outcome.checkoutUrl });
        return;
      case 'in_progress':
        sendError(res, 409, 'Payment creation is already in progress. Retry shortly.');
        return;
      case 'provider_error':
        sendError(res, 502, outcome.incomplete ? 'Mercado Pago returned an incomplete sandbox order.' : 'Mercado Pago could not create the sandbox order.');
        return;
      case 'created':
        res.status(201).json({ paymentId: outcome.paymentId, status: 'pending', checkoutUrl: outcome.checkoutUrl });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create payment.';
    sendError(res, message.includes('belong') || message.includes('changed') || message.includes('match') || message.includes('reserved') ? 409 : 400, message);
  }
});

paymentsRouter.get('/order/:pedidoId', requireFirebaseUser, async (req: AuthenticatedRequest, res) => {
  const pedidoId = text(req.params.pedidoId);
  if (!pedidoId || !/^[A-Za-z0-9_-]{1,150}$/.test(pedidoId)) {
    sendError(res, 400, 'Invalid order identifier.');
    return;
  }
  try {
    const outcome = await resumePendingPayment(req.userId!, pedidoId);
    if (outcome.kind === 'not_found') {
      sendError(res, 404, 'Order was not found.');
      return;
    }
    if (outcome.kind === 'not_resumable') {
      sendError(res, 409, 'This order has no resumable pending Mercado Pago checkout.');
      return;
    }
    if (outcome.kind === 'missing_payment') {
      sendError(res, 409, 'The pending payment could not be found. Contact support before retrying.');
      return;
    }
    res.json({ paymentId: outcome.paymentId, status: outcome.status, pedidoIds: outcome.pedidoIds, checkoutUrl: outcome.checkoutUrl });
  } catch {
    sendError(res, 500, 'Unable to resume the pending payment.');
  }
});

paymentsRouter.get('/:paymentId', requireFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const status = await readPaymentStatus(req.userId!, req.params.paymentId);
    if (!status) {
      sendError(res, 404, 'Payment was not found.');
      return;
    }
    res.json(status);
  } catch {
    sendError(res, 500, 'Unable to read payment status.');
  }
});
