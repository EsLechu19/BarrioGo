import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  refreshRol: () => Promise<void>;
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

  const cargarRol = useCallback(async (uid: string): Promise<void> => {
    try {
      const snap = await getDoc(doc(getFirestoreDb(), 'users', uid));
      const r: unknown = snap.data()?.rol;
      setRol(isRol(r) ? r : 'cliente');
    } catch {
      setRol('cliente');
    }
  }, []);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await cargarRol(u.uid);
      } else {
        setRol(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [cargarRol]);

  // Relee el rol sin pedir re-login (ej. tras registrar el negocio propio,
  // para que el tab Negocio aparezca al instante).
  const refreshRol = useCallback(async (): Promise<void> => {
    try {
      if (!firebaseReady) return;
      const u = getFirebaseAuth().currentUser;
      if (u) await cargarRol(u.uid);
    } catch {
      // Silencioso: el rol se re-lee en el próximo cambio de sesión.
    }
  }, [cargarRol]);

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
    () => ({ user, rol, loading, login, register, logout, refreshRol }),
    [user, rol, loading, login, register, logout, refreshRol],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
