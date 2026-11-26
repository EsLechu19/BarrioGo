# Desvinculación de token push al cerrar sesión

## Objetivo
Quitar del usuario saliente el token Expo del dispositivo antes de cerrar sesión, evitando notificaciones cruzadas entre cuentas.

## Alcance autorizado
- `src/services/pushNotifications.ts`
- `src/context/AuthContext.tsx`

## Restricciones
- No modificar App.tsx, servidor de notificaciones, Firebase config, reglas, `app.json`, dependencias, commit, push ni APK.
- Quitar solo el token del dispositivo actual; no eliminar tokens de otros dispositivos.

## Tareas
- [x] PUSH-1 Crear una operación segura para desvincular el token actual del usuario autenticado. Evidence: `arrayRemove(token)` en `desvincularPushToken`.
- [x] PUSH-2 Ejecutarla antes de signOut y garantizar que el cierre de sesión siempre continúe. Evidence: `try/finally` en `logout`.
- [x] PUSH-3 Ejecutar verificaciones de tipos y lint. Evidence: `npx tsc --noEmit`, `npx expo lint` y `git diff --check` con código 0.

## Criterios de aceptación
- El token actual deja de estar en `users/{uid}.expoPushTokens` tras cerrar sesión.
- Un error de token o Firestore no bloquea el logout.
- TypeScript y lint terminan sin errores.

## Estado
- Firestore Rules ya permite actualizar únicamente `expoPushTokens` del propio usuario.
- Falta prueba manual con dos cuentas en el mismo dispositivo.
- No se realizó commit, push ni build.
