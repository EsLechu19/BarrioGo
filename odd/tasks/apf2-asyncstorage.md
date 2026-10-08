# Feature: apf2-asyncstorage

## Objetivo
Persistir carrito, favoritos y sesión en AsyncStorage con validación de forma, y gate de sesión en Splash.

## Alcance autorizado
- Se instaló `@react-native-async-storage/async-storage` (avisado al equipo).
- `src/services/storage.ts`: load/save tipados + validadores (nunca `JSON.parse` a ciegas).
- Cart/Favorites: hidratan al montar y guardan al cambiar.
- Login/Register guardan sesión; Splash redirige a Tabs si hay sesión; Perfil muestra sesión real y logout limpia.
- NO Firebase todavía (APF3).

## Checklist
- [x] T1: `storage.ts` + persistencia carrito/favoritos
- [x] T2: sesión (login/register/splash/perfil)
- [x] T3: verificación (`tsc` + prueba cerrar/reabrir)

## Evidencia
- Rama `feature/apf2-asyncstorage`: `2108917 feat(storage)`, `64816f2 feat(auth)`
- `npx tsc --noEmit`: TSC-OK

## Criterios
- Cerrar y reabrir conserva carrito, favoritos y sesión. Datos corruptos → se descartan sin crash.
