import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Opinion } from '../types/Opinion';
import { ResumenOpiniones, opinionesDemo, resumenOpiniones } from '../utils/opinionesDemo';
import { crearOpinion, escucharOpiniones } from '../services/api';
import { firebaseReady } from '../services/firebase';

// Reseñas de los clientes: se juntan las de Firestore, las de la sesión y las
// de ejemplo. Todas las pantallas usan la misma lista, así el rating no choca.
interface OpinionesValue {
  // Publicadas en esta sesión (optimista), indexadas por negocioId.
  publicadas: Record<string, Opinion[]>;
  // Persiste en Firestore. Si falla, revierte la entrada optimista y
  // relanza el error para que la pantalla lo muestre.
  publicar: (opinion: Opinion) => Promise<void>;
  // Lista completa de un negocio: Firestore + sesión + ejemplos.
  listaDe: (negocioId: string) => Opinion[];
}

const OpinionesContext = createContext<OpinionesValue | null>(null);

export function OpinionesProvider({ children }: { children: ReactNode }) {
  const [publicadas, setPublicadas] = useState<Record<string, Opinion[]>>({});
  const [guardadas, setGuardadas] = useState<Record<string, Opinion[]>>({});

  useEffect(() => {
    if (!firebaseReady) return;
    return escucharOpiniones(
      (lista: Opinion[]) => {
        const porNegocio: Record<string, Opinion[]> = {};
        for (const o of lista) {
          const grupo = porNegocio[o.negocioId];
          if (grupo) grupo.push(o);
          else porNegocio[o.negocioId] = [o];
        }
        setGuardadas(porNegocio);
      },
      () => {
        // Sin reglas publicadas o sin red, siguen sesión + ejemplos:
        // la app no se rompe por opiniones.
      },
    );
  }, []);

  const publicar = useCallback(async (opinion: Opinion): Promise<void> => {
    // Optimista: se ve al instante, como hasta ahora.
    setPublicadas((prev) => ({
      ...prev,
      [opinion.negocioId]: [opinion, ...(prev[opinion.negocioId] ?? [])],
    }));
    if (!firebaseReady) return; // sin config: se queda solo en sesión
    try {
      await crearOpinion({
        negocioId: opinion.negocioId,
        usuarioId: opinion.usuarioId,
        nombre: opinion.nombre,
        estrellas: opinion.estrellas,
        texto: opinion.texto,
        fecha: opinion.fecha,
      });
    } catch (e) {
      // Rollback de la entrada optimista (sin esto, una opinión rechazada
      // por reglas/sin red quedaría visible en pantalla sin persistirse).
      setPublicadas((prev) => ({
        ...prev,
        [opinion.negocioId]: (prev[opinion.negocioId] ?? []).filter(
          (o) => o.id !== opinion.id,
        ),
      }));
      throw e instanceof Error ? e : new Error('No se pudo publicar la opinión.');
    }
  }, []);

  const listaDe = useCallback(
    (negocioId: string): Opinion[] => {
      // Misma clave natural que usa la opinión optimista y su documento en
      // Firestore (crearOpinion reutiliza la fecha) → nunca se duplica.
      const clave = (o: Opinion): string => `${o.usuarioId}|${o.fecha}|${o.texto}`;
      const vistas = new Set<string>();
      const salida: Opinion[] = [];
      // Firestore primero (lo persistido manda); la sesión aporta lo que
      // aún no llegó o lo publicado sin Firebase configurado.
      for (const o of [
        ...(guardadas[negocioId] ?? []),
        ...(publicadas[negocioId] ?? []),
      ]) {
        const k = clave(o);
        if (vistas.has(k)) continue;
        vistas.add(k);
        salida.push(o);
      }
      // El pool de ejemplos SIEMPRE queda: todo negocio tiene contenido.
      return [...salida, ...opinionesDemo(negocioId)];
    },
    [guardadas, publicadas],
  );

  const value = useMemo<OpinionesValue>(
    () => ({ publicadas, publicar, listaDe }),
    [publicadas, publicar, listaDe],
  );

  return <OpinionesContext.Provider value={value}>{children}</OpinionesContext.Provider>;
}

export function useOpiniones(): OpinionesValue {
  const ctx = useContext(OpinionesContext);
  if (!ctx) throw new Error('useOpiniones debe usarse dentro de OpinionesProvider');
  return ctx;
}

// Rating (promedio + conteo) calculado de la lista de opiniones.
// Todas las pantallas usan este resumen, nunca el `rating` del catálogo.
export function useResumenOpiniones(negocioId: string): ResumenOpiniones {
  const { listaDe } = useOpiniones();
  return useMemo(() => resumenOpiniones(listaDe(negocioId)), [listaDe, negocioId]);
}
