import crypto from 'node:crypto';
import type { Request } from 'express';
import { runtimeEnv } from '../config/env.js';
import { text } from './orderValidation.js';

export function signatureIsValid(req: Request): boolean {
  const webhookSecret = runtimeEnv.mercadoPagoWebhookSecret;
  if (!webhookSecret) return false;
  const signature = req.header('x-signature') ?? '';
  const requestId = req.header('x-request-id') ?? '';
  const dataId = text(req.query['data.id']) ?? text((req.body as { data?: { id?: unknown } } | undefined)?.data?.id);
  const parts = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=', 2) as [string, string]));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!dataId || !ts || !v1 || !/^[a-f0-9]{64}$/i.test(v1)) return false;
  const manifest = `id:${dataId};${requestId ? `request-id:${requestId};` : ''}ts:${ts};`;
  const expected = crypto.createHmac('sha256', webhookSecret).update(manifest).digest();
  const actual = Buffer.from(v1, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
