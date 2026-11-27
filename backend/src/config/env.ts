import 'dotenv/config';

function positivePort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return 4000;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65_535 ? parsed : 4000;
}

export const runtimeEnv = {
  port: positivePort(process.env.PORT),
  mercadoPagoAccessToken: process.env.MP_ACCESS_TOKEN_TEST,
  mercadoPagoWebhookSecret: process.env.MP_WEBHOOK_SECRET,
  publicBackendUrl: process.env.PUBLIC_BACKEND_URL?.trim().replace(/\/$/, ''),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

export function isSandboxPaymentConfigured(): boolean {
  return Boolean(runtimeEnv.mercadoPagoAccessToken) &&
    Boolean(runtimeEnv.publicBackendUrl) &&
    /^https:\/\//i.test(runtimeEnv.publicBackendUrl ?? '');
}

export function hasSandboxAccessToken(): boolean {
  return Boolean(runtimeEnv.mercadoPagoAccessToken);
}
