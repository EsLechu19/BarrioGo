import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { firebaseReady, getFirestoreDb } from '../services/firebase';

export interface VinculoNegocio {
  negocioId: string | null;
  loading: boolean;
  error: string | null;
  // Permite actualizar el vínculo tras registrar un negocio, sin re-leer.
  setNegocioId: (id: string | null) => void;
}

// Lee users/{uid}.negocioId. Mismo comportamiento que tenía cada pantalla
// por separado: sin Firebase o sin sesión, loading pasa a false sin error.
export function useNegocioId(): VinculoNegocio {
  const { user } = useAuth();
  const uid: string | undefined = user?.uid;
  const [negocioId, setNegocioId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    async function leer(): Promise<void> {
      if (!firebaseReady || !uid) {
        if (activo) setLoading(false);
        return;
      }
      if (activo) {
        setLoading(true);
        setError(null);
      }
      try {
        const snap = await getDoc(doc(getFirestoreDb(), 'users', uid));
        const data: unknown = snap.exists() ? snap.data() : null;
        const id: unknown =
          typeof data === 'object' && data !== null
            ? (data as { negocioId?: unknown }).negocioId
            : undefined;
        if (activo) setNegocioId(typeof id === 'string' && id.trim() ? id : null);
      } catch (e) {
        if (activo) {
          setError(
            e instanceof Error
              ? `No se pudo leer tu negocio: ${e.message}`
              : 'No se pudo leer tu negocio. Intentá de nuevo.',
          );
          setNegocioId(null);
        }
      } finally {
        if (activo) setLoading(false);
      }
    }
    void leer();
    return () => {
      activo = false;
    };
  }, [uid]);

  return { negocioId, loading, error, setNegocioId };
}
