import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { storage } from '../services/storage';

// Favoritos en memoria para APF2. En el siguiente feature se persiste
// con AsyncStorage (Cap. III 3.3 del informe ejemplo).
interface FavoritesContextValue {
  ids: string[];
  toggle: (negocioId: string) => void;
  esFavorito: (negocioId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    storage.loadFavorites().then((saved) => {
      if (saved) setIds(saved);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) storage.saveFavorites(ids);
  }, [ids, hydrated]);

  const toggle = useCallback((negocioId: string) => {
    setIds((prev) =>
      prev.includes(negocioId)
        ? prev.filter((id) => id !== negocioId)
        : [...prev, negocioId],
    );
  }, []);

  const esFavorito = useCallback(
    (negocioId: string) => ids.includes(negocioId),
    [ids],
  );

  const value = useMemo(
    () => ({ ids, toggle, esFavorito }),
    [ids, toggle, esFavorito],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  return ctx;
}
