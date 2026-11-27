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
  | { valid: false; reason: WebhookSignatureFailureReason; diagnostics: WebhookSignatureDiagnostics };

export interface WebhookSignatureDiagnostics {
  secretConfigured: boolean;
  secretHasOuterWhitespace: boolean;
  xSignaturePresent: boolean;
  tsPresent: boolean;
  v1Present: boolean;
  v1ValidHex: boolean;
  dataIdSource: 'query' | 'body' | 'missing';
  dataIdSourcesEqual: boolean;
  dataIdCase: 'upper' | 'lower' | 'mixed' | 'none';
  requestIdPresent: boolean;
  manifestMatches: {
    canonicalLowercaseIdWithRequestId: boolean;
    rawIdWithRequestId: boolean;
    rawIdWithoutRequestId: boolean;
    lowercaseIdWithoutRequestId: boolean;
    trimmedSecretLowercaseIdWithRequestId: boolean;
  };
}

function manifestFor(dataId: string, requestId: string, ts: string): string {
  return `id:${dataId};${requestId ? `request-id:${requestId};` : ''}ts:${ts};`;
}

function safeDigestMatch(secret: string, manifest: string, actual: Buffer): boolean {
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest();
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function classifyDataIdCase(dataId: string | null | undefined): WebhookSignatureDiagnostics['dataIdCase'] {
  if (!dataId || !/[a-z]/i.test(dataId)) return 'none';
  if (dataId === dataId.toUpperCase()) return 'upper';
  if (dataId === dataId.toLowerCase()) return 'lower';
  return 'mixed';
}

function getDiagnostics(
  req: Request,
  secret: string | null | undefined,
  requestId: string,
  ts: string | undefined,
  v1: string | undefined,
): WebhookSignatureDiagnostics {
  const queryId = text(req.query['data.id']);
  const bodyId = text((req.body as { data?: { id?: unknown } } | undefined)?.data?.id);
  const dataId = queryId ?? bodyId;
  const v1ValidHex = Boolean(v1 && /^[a-f0-9]{64}$/i.test(v1));
  const manifestMatches: WebhookSignatureDiagnostics['manifestMatches'] = {
    canonicalLowercaseIdWithRequestId: false,
    rawIdWithRequestId: false,
    rawIdWithoutRequestId: false,
    lowercaseIdWithoutRequestId: false,
    trimmedSecretLowercaseIdWithRequestId: false,
  };

  // Candidate HMACs run only after a rejection and never change acceptance.
  if (secret && dataId && ts && v1ValidHex) {
    const actual = Buffer.from(v1!, 'hex');
    const canonical = manifestFor(dataId.toLowerCase(), requestId, ts);
    manifestMatches.canonicalLowercaseIdWithRequestId = Boolean(requestId)
      && safeDigestMatch(secret, canonical, actual);
    manifestMatches.rawIdWithRequestId = Boolean(requestId)
      && safeDigestMatch(secret, manifestFor(dataId, requestId, ts), actual);
    manifestMatches.rawIdWithoutRequestId = safeDigestMatch(secret, manifestFor(dataId, '', ts), actual);
    manifestMatches.lowercaseIdWithoutRequestId = safeDigestMatch(secret, manifestFor(dataId.toLowerCase(), '', ts), actual);
    manifestMatches.trimmedSecretLowercaseIdWithRequestId = Boolean(requestId)
      && safeDigestMatch(secret.trim(), canonical, actual);
  }

  return {
    secretConfigured: Boolean(secret),
    secretHasOuterWhitespace: Boolean(secret && secret.trim() !== secret),
    xSignaturePresent: Boolean(req.header('x-signature')),
    tsPresent: Boolean(ts),
    v1Present: Boolean(v1),
    v1ValidHex,
    dataIdSource: queryId ? 'query' : bodyId ? 'body' : 'missing',
    dataIdSourcesEqual: Boolean(queryId && bodyId && queryId === bodyId),
    dataIdCase: classifyDataIdCase(dataId),
    requestIdPresent: Boolean(requestId),
    manifestMatches,
  };
}

export function validateWebhookSignature(req: Request): WebhookSignatureResult {
  const webhookSecret = runtimeEnv.mercadoPagoWebhookSecret;
  const signature = req.header('x-signature');
  const requestId = req.header('x-request-id') ?? '';
  const dataId = text(req.query['data.id']) ?? text((req.body as { data?: { id?: unknown } } | undefined)?.data?.id);
  const parts = Object.fromEntries((signature ?? '').split(',').map((part) => part.trim().split('=', 2) as [string, string]));
  const ts = parts.ts;
  const v1 = parts.v1;
  const fail = (reason: WebhookSignatureFailureReason): WebhookSignatureResult => ({
    valid: false,
    reason,
    diagnostics: getDiagnostics(req, webhookSecret, requestId, ts, v1),
  });

  if (!webhookSecret) return fail('webhook_secret_missing');
  if (!signature || !ts || !v1 || !/^[a-f0-9]{64}$/i.test(v1)) {
    return fail('x_signature_missing_or_malformed');
  }
  if (!dataId) return fail('data_id_missing');
  const manifest = manifestFor(dataId.toLowerCase(), requestId, ts);
  const expected = crypto.createHmac('sha256', webhookSecret).update(manifest).digest();
  const actual = Buffer.from(v1, 'hex');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return fail('signature_mismatch');
  }
  return { valid: true };
}
