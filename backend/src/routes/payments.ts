import { Router, type Response as ExpressResponse } from 'express';
import { requireFirebaseUser } from '../middleware/requireFirebaseUser.js';
import { text } from '../payments/orderValidation.js';
import { createOrReusePayment, readPaymentStatus, reconcilePendingPayment, resumePendingPayment } from '../payments/paymentService.js';
import type { AuthenticatedRequest } from '../types/payment.js';

function sendError(res: ExpressResponse, status: number, code: string): void {
  res.status(status).json({ error: code });
}

export const paymentsRouter = Router();

paymentsRouter.get('/eligibility', requireFirebaseUser, (req: AuthenticatedRequest, res) => {
  if (!req.verifiedEmail) {
    sendError(res, 403, 'EMAIL_VERIFICATION_REQUIRED');
    return;
  }
  res.json({ eligible: true });
});

paymentsRouter.post('/', requireFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const outcome = await createOrReusePayment(req.userId!, req.verifiedEmail, req.body?.pedidoIds);
    switch (outcome.kind) {
      case 'not_configured':
        sendError(res, 503, 'PAYMENT_NOT_CONFIGURED');
        return;
      case 'email_verification_required':
        sendError(res, 403, 'EMAIL_VERIFICATION_REQUIRED');
        return;
      case 'review_required':
        sendError(res, 409, 'PAYMENT_REVIEW_REQUIRED');
        return;
      case 'terminal':
        res.json({ paymentId: outcome.paymentId, status: outcome.status });
        return;
      case 'checkout':
        res.json({ paymentId: outcome.paymentId, status: outcome.status, checkoutUrl: outcome.checkoutUrl });
        return;
      case 'in_progress':
        sendError(res, 409, 'PAYMENT_CREATION_IN_PROGRESS');
        return;
      case 'provider_error':
        sendError(res, 502, outcome.outcome === 'uncertain' ? 'PAYMENT_PROVIDER_UNCERTAIN' : 'PAYMENT_PROVIDER_REJECTED');
        return;
      case 'created':
        res.status(201).json({ paymentId: outcome.paymentId, status: 'pending', checkoutUrl: outcome.checkoutUrl });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const conflict = ['belong', 'changed', 'match', 'reserved', 'conflict'].some((part) => message.includes(part));
    sendError(res, conflict ? 409 : 400, conflict ? 'ORDER_CONFLICT' : 'INVALID_PAYMENT_REQUEST');
  }
});

paymentsRouter.get('/order/:pedidoId', requireFirebaseUser, async (req: AuthenticatedRequest, res) => {
  const pedidoId = text(req.params.pedidoId);
  if (!pedidoId || !/^[A-Za-z0-9_-]{1,150}$/.test(pedidoId)) {
    sendError(res, 400, 'INVALID_ORDER_IDENTIFIER');
    return;
  }
  try {
    const outcome = await resumePendingPayment(req.userId!, pedidoId);
    if (outcome.kind === 'not_found') {
      sendError(res, 404, 'ORDER_NOT_FOUND');
      return;
    }
    if (outcome.kind === 'not_resumable') {
      sendError(res, 409, 'PAYMENT_NOT_RESUMABLE');
      return;
    }
    if (outcome.kind === 'missing_payment') {
      sendError(res, 409, 'PAYMENT_RECORD_MISSING');
      return;
    }
    res.json({ paymentId: outcome.paymentId, status: outcome.status, pedidoIds: outcome.pedidoIds, checkoutUrl: outcome.checkoutUrl });
  } catch {
    sendError(res, 500, 'PAYMENT_RESUME_FAILED');
  }
});

paymentsRouter.post('/:paymentId/reconcile', requireFirebaseUser, async (req: AuthenticatedRequest, res) => {
  const paymentId = text(req.params.paymentId);
  if (!paymentId || !/^[a-f0-9]{64}$/.test(paymentId)) {
    sendError(res, 400, 'INVALID_PAYMENT_IDENTIFIER');
    return;
  }
  try {
    const status = await reconcilePendingPayment(req.userId!, paymentId);
    if (!status) {
      sendError(res, 404, 'PAYMENT_NOT_FOUND');
      return;
    }
    res.json(status);
  } catch {
    sendError(res, 502, 'PAYMENT_RECONCILIATION_UNAVAILABLE');
  }
});

paymentsRouter.get('/:paymentId', requireFirebaseUser, async (req: AuthenticatedRequest, res) => {
  try {
    const status = await readPaymentStatus(req.userId!, req.params.paymentId);
    if (!status) {
      sendError(res, 404, 'PAYMENT_NOT_FOUND');
      return;
    }
    res.json(status);
  } catch {
    sendError(res, 500, 'PAYMENT_STATUS_UNAVAILABLE');
  }
});
