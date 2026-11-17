
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { doc, getDoc, setDoc } from 'firebase/firestore';

import {
  firebaseReady,
  getFirebaseAuth,
  getFirestoreDb,
} from '../services/firebase';

export type Rol = 'cliente' | 'negocio';

interface AuthContextValue {
  user: User | null;
  rol: Rol | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    nombre: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshRol: () => Promise<void>;
  recuperarContrasena: (email: string) => Promise<void>;
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

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [rol, setRol] = useState<Rol | null>(null);

  // Esperar la recuperación de sesión y rol.
  const [loading, setLoading] = useState<boolean>(true);

  const [, setSelloAuth] = useState<number>(0);

  const completarDisplayName = useCallback(
    async (u: User): Promise<void> => {
      try {
        if (u.displayName?.trim()) return;

        const snap = await getDoc(
          doc(getFirestoreDb(), 'users', u.uid)
        );

        const nombre: unknown = snap.data()?.nombre;

        if (
          typeof nombre === 'string' &&
          nombre.trim()
        ) {
          await updateProfile(u, {
            displayName: nombre.trim(),
          });

          setSelloAuth(s => s + 1);
        }
      } catch (error) {
        console.warn(
          '[AUTH] No se pudo completar el nombre:',
          error
        );
      }
    },
    []
  );

  // Consultar el rol real desde Firestore.
  const cargarRol = useCallback(
    async (uid: string): Promise<void> => {
      try {
        const snap = await getDoc(
          doc(getFirestoreDb(), 'users', uid)
        );

        if (!snap.exists()) {
          console.warn(
            '[AUTH] Documento no encontrado:',
            uid
          );
          setRol(null);
          return;
        }

        const data = snap.data();
        const rolFirestore: unknown = data.rol;

        console.log(
          '[AUTH] Rol recibido:',
          rolFirestore
        );

        console.log(
          '[AUTH] Negocio ID:',
          data.negocioId
        );

        if (typeof rolFirestore === 'string') {
          const rolNormalizado =
            rolFirestore.trim().toLowerCase();

          if (isRol(rolNormalizado)) {
            setRol(rolNormalizado);
            return;
          }
        }

        console.warn(
          '[AUTH] Rol inválido:',
          rolFirestore
        );

        setRol(null);
      } catch (error) {
        console.error(
          '[AUTH] Error recuperando rol:',
          error
        );

        // No convertir errores de Firebase en rol cliente.
        setRol(null);
      }
    },
    []
  );

  useEffect(() => {
    let activo = true;
    let version = 0;

    if (!firebaseReady) {
      console.error(
        '[AUTH] Firebase no está configurado'
      );
      return;
    }

    const auth = getFirebaseAuth();

    const unsub = onAuthStateChanged(auth, u => {
      const actual = ++version;

      setLoading(true);
      setUser(u);
      setRol(null);

      if (!u) {
        setLoading(false);
        return;
      }

      // Primero recuperar rol, después nombre.
      void (async () => {
        try {
          const snap = await getDoc(
            doc(getFirestoreDb(), 'users', u.uid)
          );

          if (!activo || actual !== version) return;

          if (snap.exists()) {
            const r: unknown = snap.data().rol;

            if (typeof r === 'string') {
              const normalizado = r.trim().toLowerCase();

              setRol(
                isRol(normalizado) ? normalizado : null
              );
            } else {
              setRol(null);
            }
          } else {
            setRol(null);
          }
        } catch (error) {
          console.error(
            '[AUTH] Error inicializando rol:',
            error
          );

          if (activo && actual === version) {
            setRol(null);
          }
        } finally {
          if (activo && actual === version) {
            setLoading(false);
          }
        }

        if (activo && actual === version) {
          void completarDisplayName(u);
        }
      })();
    });

    return () => {
      activo = false;
      version++;
      unsub();
    };
  }, [completarDisplayName]);

  // Actualizar rol sin cerrar sesión.
  const refreshRol = useCallback(
    async (): Promise<void> => {
      if (!firebaseReady) return;

      const u = getFirebaseAuth().currentUser;

      if (u) {
        await cargarRol(u.uid);
      }
    },
    [cargarRol]
  );

  const login = async (
    email: string,
    password: string
  ): Promise<void> => {
    await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password
    );
  };

  const register = async (
    nombre: string,
    email: string,
    password: string
  ): Promise<void> => {
    const cred = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password
    );

    await setDoc(
      doc(getFirestoreDb(), 'users', cred.user.uid),
      {
        nombre: nombre.trim(),
        email: email.trim(),
        rol: 'cliente',
        createdAt: new Date().toISOString(),
      }
    );

    await updateProfile(cred.user, {
      displayName: nombre.trim(),
    });

    setSelloAuth(s => s + 1);

    await refreshRol();
  };

  const logout = async (): Promise<void> => {
    await signOut(getFirebaseAuth());
  };

  const recuperarContrasena = useCallback(
    async (email: string): Promise<void> => {
      await sendPasswordResetEmail(
        getFirebaseAuth(),
        email.trim()
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      rol,
      loading,
      login,
      register,
      logout,
      refreshRol,
      recuperarContrasena,
    }),
    [user, rol, loading, refreshRol]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth debe usarse dentro de AuthProvider'
    );
  }

  return ctx;
}
