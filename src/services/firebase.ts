import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Config vía EXPO_PUBLIC_ (nunca commitear el .env real — ver .env.example).
// Si falta config, firebaseReady = false y la app sigue con API local + Auth simulado.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FB_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FB_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FB_APP_ID ?? '',
};

export const firebaseReady: boolean = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseReady) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
  auth = getAuth(app);
  db = getFirestore(app);
}

export function getFirebaseAuth(): Auth {
  if (!auth) throw new Error('Firebase no configurado: falta el .env (ver .env.example)');
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (!db) throw new Error('Firebase no configurado: falta el .env (ver .env.example)');
  return db;
}
