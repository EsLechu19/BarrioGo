# Feature: apf3-firebase (Auth + Firestore + roles)

## Objetivo
Auth real, persistencia real en Firestore y panel negocio mínimo. Cámara + notificaciones.

## Fases
- [x] F0 base: deps (firebase, image-picker, notifications) + `firebase.ts` con gate + `.env.example` + `.env` ignorado
- [x] F1 Auth real: login/registro con Firebase Auth, sesión persistente, rol `cliente|negocio` en `users/{uid}`
- [x] F2 código: seed + `api.ts` triple origen (Firestore → mock → local) + JSON fuente única
- [x] F2 equipo: `firestore.rules` publicadas + `service-account.json` + `npm run seed` (15 negocios, 48 productos)
- [x] F3 Pedidos: crear pedido + listener de `EstadoPedido` (commits 44467d3, f5953ca: sin índice compuesto, sort en memoria)
- [x] F4 Negocio: pedidos por negocio + avance de estados + alta de menú (commit a10adda; vínculo en `users/{uid}` con `rol` + `negocioId`; foto real OUT sin Storage)
- [x] F5 Notificaciones locales por cambio de estado (commits a23e2b2, f129b12; no-op en Expo Go desde SDK 53, activas en dev build/APK) + guía E2E en `odd/tasks/apf5-notificaciones.md`

## Bloqueado en
Config del proyecto Firebase del equipo (apiKey, projectId, appId en `.env`). Sin eso F1 no arranca.
