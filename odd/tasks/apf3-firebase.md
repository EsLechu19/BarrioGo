# Feature: apf3-firebase (Auth + Firestore + roles)

## Objetivo
Auth real, persistencia real en Firestore y panel negocio mínimo. Cámara + notificaciones.

## Fases
- [x] F0 base: deps (firebase, image-picker, notifications) + `firebase.ts` con gate + `.env.example` + `.env` ignorado
- [x] F1 Auth real: login/registro con Firebase Auth, sesión persistente, rol `cliente|negocio` en `users/{uid}`
- [x] F2 código: seed + `api.ts` triple origen (Firestore → mock → local) + JSON fuente única
- [ ] F2 pendiente equipo: pegar `firestore.rules` en consola + descargar `service-account.json` → corro `npm run seed`
- [ ] F3 Pedidos: crear pedido + listener de `EstadoPedido` en cliente; negocio cambia estados
- [ ] F4 Negocio: Mis pedidos + Mi menú (alta con foto cámara/galería) + reglas de seguridad
- [ ] F5 Notificaciones locales por cambio de estado + verificación E2E en físico

## Bloqueado en
Config del proyecto Firebase del equipo (apiKey, projectId, appId en `.env`). Sin eso F1 no arranca.
