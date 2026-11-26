import express from 'express';
import helmet from 'helmet';
import { checkoutRouter } from './routes/checkout.js';
import { paymentsRouter } from './routes/payments.js';
import { webhooksRouter } from './routes/webhooks.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use('/api/payments', paymentsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use(checkoutRouter);
