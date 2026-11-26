import { Router } from 'express';
import { text } from '../payments/orderValidation.js';

export const checkoutRouter = Router();

checkoutRouter.get('/checkout-return', (req, res) => {
  const paymentId = text(req.query.paymentId);
  if (!paymentId || !/^[a-f0-9]{64}$/.test(paymentId)) {
    res.status(400).type('text').send('Invalid payment return.');
    return;
  }
  const deepLink = `barriogo://checkout-return?paymentId=${encodeURIComponent(paymentId)}`;
  res.type('html').send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Returning to BarrioGo</title><body><p>Returning to BarrioGo…</p><a href="${deepLink}">Open the app</a><script>window.location.replace(${JSON.stringify(deepLink)});</script></body></html>`);
});

checkoutRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));
