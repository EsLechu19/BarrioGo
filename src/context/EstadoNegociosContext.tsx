import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Negocio } from '../types/Negocio';
import { cambiarAbiertoNegocio } from '../services/api';
import { useAuth } from './AuthContext';

// Abrir/cerrar manual: se guarda en negocios/{id}.abiertoManual y este
// contexto lo replica en sesión. El efectivo se deriva con estaAbierto().
interface EstadoNegociosValue {
  overrides: Record<string, boolean>;
  // Guarda en Firestore y actualiza la caché. Lanza si no se pudo guardar
  // (el caller muestra el error).
  setOverride: (negocioId: string, abierto: boolean) => Promise<void>;
  // Fusiona el override de la sesión sobre el negocio (si no hay override,
  // conserva el abiertoManual que venga del backend/mock).
  conOverride: (n: Negocio) => Negocio;
}

const EstadoNegociosContext = createContext<EstadoNegociosValue | null>(null);

export function EstadoNegociosProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const setOverride = useCallback(
    async (negocioId: string, abierto: boolean): Promise<void> => {
      if (!user) throw new Error('Iniciá sesión para cambiar el estado del negocio.');
      // Primero el servidor: si falla (sin red / no es dueño), no se toca
      // la caché y la pantalla ve el estado real anterior.
      await cambiarAbiertoNegocio(negocioId, user.uid, abierto);
      setOverrides((prev) => ({ ...prev, [negocioId]: abierto }));
    },
    [user],
  );

  const conOverride = useCallback(
    (n: Negocio): Negocio => {
      const override = overrides[n.id];
      return override === undefined ? n : { ...n, abiertoManual: override };
    },
    [overrides],
  );

  const value = useMemo(
    () => ({ overrides, setOverride, conOverride }),
    [overrides, setOverride, conOverride],
  );

  return (
    <EstadoNegociosContext.Provider value={value}>{children}</EstadoNegociosContext.Provider>
  );
}

export function useEstadoNegocios(): EstadoNegociosValue {
  const ctx = useContext(EstadoNegociosContext);
  if (!ctx) throw new Error('useEstadoNegocios debe usarse dentro de EstadoNegociosProvider');
  return ctx;
}
