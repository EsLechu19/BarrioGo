import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseReady, getFirebaseAuth, getFirestoreDb } from '../services/firebase';

export type Rol = 'cliente' | 'negocio';

interface AuthContextValue {
  user: User | null;
  rol: Rol | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isRol(value: unknown): value is Rol {
  return value === 'cliente' || value === 'negocio';
}

export function authErrorEs(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Ese correo no tiene un formato válido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Ese correo ya tiene cuenta. Iniciá sesión.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisá tu internet e intentá de nuevo.';
    case 'auth/too-many-requests':
      return 'Muchos intentos. Esperá unos minutos.';
    default:
      return 'No pudimos completar la operación. Intentá de nuevo.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [rol, setRol] = useState<Rol | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(getFirestoreDb(), 'users', u.uid));
          const r: unknown = snap.data()?.rol;
          setRol(isRol(r) ? r : 'cliente');
        } catch {
          setRol('cliente');
        }
      } else {
        setRol(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    // El listener onAuthStateChanged actualiza user/rol solo.
  };

  const register = async (nombre: string, email: string, password: string): Promise<void> => {
    const cred = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    await setDoc(doc(getFirestoreDb(), 'users', cred.user.uid), {
      nombre: nombre.trim(),
      email: email.trim(),
      rol: 'cliente',
      createdAt: new Date().toISOString(),
    });
  };

  const logout = async (): Promise<void> => {
    await signOut(getFirebaseAuth());
  };

  const value = useMemo(
    () => ({ user, rol, loading, login, register, logout }),
    [user, rol, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
