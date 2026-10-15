import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Colors, darkColors, lightColors } from '../styles/colors';
import { storage } from '../services/storage';

// Tema claro/oscuro de la app. La preferencia vive en AsyncStorage con la
// clave '@prefs/theme' (string 'dark' | 'light', igual que el lab del curso).
interface ThemeContextValue {
  isDark: boolean;
  colors: Colors;
  toggleTheme: (nuevo: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(false);

  // Al abrir la app: leer la preferencia guardada (si existe, se aplica).
  useEffect(() => {
    let activo = true;
    storage
      .loadTheme()
      .then((valor) => {
        if (activo && valor !== null) setIsDark(valor === 'dark');
      })
      .catch(() => {
        // Sin preferencia guardada: se queda en claro.
      });
    return () => {
      activo = false;
    };
  }, []);

  // Al mover el interruptor: estado al instante + guardar la preferencia.
  const toggleTheme = (nuevo: boolean): void => {
    setIsDark(nuevo);
    void storage.saveTheme(nuevo ? 'dark' : 'light');
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      colors: isDark ? darkColors : lightColors,
      toggleTheme,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}

// Hook corto para los componentes: solo necesitan la paleta activa.
export function useColors(): Colors {
  return useTheme().colors;
}
