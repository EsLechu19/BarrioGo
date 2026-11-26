import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { runtimeEnv } from './env.js';

if (!getApps().length) {
  const { firebaseProjectId, firebaseClientEmail, firebasePrivateKey } = runtimeEnv;
  if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
    initializeApp({ credential: cert({ projectId: firebaseProjectId, clientEmail: firebaseClientEmail, privateKey: firebasePrivateKey }) });
  } else {
    initializeApp({ credential: applicationDefault() });
  }
}

export const db = getFirestore();
export const auth = getAuth();
