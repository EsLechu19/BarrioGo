# Feature: apf2-flatlist-api-hooks

## Objetivo
Dejar Home como pide el profe: FlatList + consumo de API + useState/useEffect con loading/error, sin romper Login/Register ni navegación.

## Problema
Home actual usa `View + .map` con array hardcodeado, sin estados, sin API, sin loading/error. No cumple Capítulo III (3.3) ni Capítulo IV del informe.

## Por qué
Requisito explícito del docente + rúbrica APF2 (consumo API 25%, estados/eventos 25%) + evidencia para informe (requests/responses, AsyncStorage después, sensores después).

## Alcance autorizado
- Refactor solo `HomeScreen` a FlatList + hooks.
- Crear `src/services/api.ts` con `fetch` nativo (sin instalar axios, por regla AGENTS.md).
- Mock local como fallback si no hay red.
- NO tocar Auth real, GPS, cámara, notificaciones (Fase 3).
- NO instalar dependencias nuevas sin OK.

## Checklist
- [x] T1: `src/services/api.ts` — `getNegocios(): Promise<Negocio[]>` con loading/error, fetch + fallback mock
- [x] T2: `HomeScreen` — FlatList + `useState`/`useEffect`, estados loading/error/refresh, `keyExtractor`, `ListEmptyComponent`
- [x] T3: Verificación — `npx tsc --noEmit` OK + captura request/response para Capítulo IV

## Evidencia
- Commits en `feature/apf2-flatlist-api`: `4cb83d0 feat(api)`, `f86fc30 refactor(home)`
- `npx tsc --noEmit`: TSC-OK
- `GET http://localhost:3000/negocios`: 4 negocios OK

## Criterios de aceptación
- Home muestra lista vía FlatList, con spinner mientras carga y mensaje de error si falla fetch.
- Ninguna pantalla usa fetch directo, todo pasa por `api.ts`.
- `npx tsc --noEmit` sin errores.

## Checks aplicables
- `npx tsc --noEmit`
- `npx expo start -c` + prueba manual Home

## Mapeo al informe del profe
- 2.4 Fundamentación: Hooks, FlatList, APIs REST, fetch
- 3.1 Requerimientos: RF ver negocios, RNF loading/error <2s
- 3.2 Diseño: `api.ts` → Home → RestaurantCard
- 3.3 Desarrollo: componentes + Hooks + consumo API
- 4 Resultados: captura Home + ejemplo request/response
