# Feature: apf2-gps-cercania

## Objetivo
Ordenar Home por cercanía real con GPS foreground + fallback si se niega el permiso.

## Alcance autorizado
- Se instaló `expo-location` vía `npx expo install` (versión SDK, avisado al equipo).
- `Negocio` suma `lat/lng` (SJL); espejo en mock-server; `location.ts` con haversine + permiso.
- Home: pide permiso, calcula distancia real, reordena; sin GPS sigue con orden del mock.
- NO tracking del repartidor (por decisión de alcance: estados en APF3).

## Checklist
- [x] Coords + servicio + Home + app.json (iOS plist)
- [x] `tsc` OK + `GET /negocios` con lat/lng

## Evidencia
- Rama `feature/apf2-gps-cercania`: `0be0127 feat(gps)`
- Ojo: se mataron procesos node huérfanos del puerto 3000 (mock-servers viejos). Si tu `expo start` se cortó, levantalo de nuevo.
