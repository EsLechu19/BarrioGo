import crypto from 'node:crypto';
import type { Request } from 'express';
import { runtimeEnv } from '../config/env.js';
import { text } from './orderValidation.js';

export type WebhookSignatureFailureReason =
  | 'webhook_secret_missing'
  | 'x_signature_missing_or_malformed'
  | 'data_id_missing'
  | 'signature_mismatch';

export type WebhookSignatureResult =
  | { valid: true }
  | { valid: false; reason: WebhookSignatureFailureReason };

export function validateWebhookSignature(req: Request): WebhookSignatureResult {
  const webhookSecret = runtimeEnv.mercadoPagoWebhookSecret;
  if (!webhookSecret) return { valid: false, reason: 'webhook_secret_missing' };
  const signature = req.header('x-signature');
  if (!signature) return { valid: false, reason: 'x_signature_missing_or_malformed' };
  const requestId = req.header('x-request-id') ?? '';
  const dataId = text(req.query['data.id']) ?? text((req.body as { data?: { id?: unknown } } | undefined)?.data?.id);
  const parts = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=', 2) as [string, string]));
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !/^[a-f0-9]{64}$/i.test(v1)) {
    return { valid: false, reason: 'x_signature_missing_or_malformed' };
  }
  if (!dataId) return { valid: false, reason: 'data_id_missing' };
  const manifest = `id:${dataId};${requestId ? `request-id:${requestId};` : ''}ts:${ts};`;
  const expected = crypto.createHmac('sha256', webhookSecret).update(manifest).digest();
  const actual = Buffer.from(v1, 'hex');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return { valid: false, reason: 'signature_mismatch' };
  }
  return { valid: true };
}
