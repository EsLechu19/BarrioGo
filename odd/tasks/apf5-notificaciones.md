# Feature: apf5-notificaciones (F5 Notificaciones + E2E)

## Objetivo
El cliente recibe una notificación local cuando el negocio cambia el estado de su pedido, y queda una guía E2E verificable en físico.

## Problema
- `expo-notifications` instalado (~57.0.22) pero sin uso real.
- `PedidosScreen` ya escucha cambios en tiempo real pero es silencioso en segundo plano.

## Por qué
Cierra APF3: el tracking deja de exigir mirar la pantalla.

## Alcance
- IN: `src/services/notificaciones.ts` (permiso + disparo local) + hook en `PedidosScreen` (notifica solo cambios de estado post-carga inicial) + guía E2E en este doc.
- OUT: push remotas/FCM, sonidos/badges custom, notificaciones al negocio.

## Restricciones
- Leer docs versionados Expo v57 antes de codificar (AGENTS.md lo exige).
- Permiso denegado o error de hardware → la app sigue andando, sin notificar y sin crashear.
- Todo Firestore sigue pasando por `api.ts`. Sin `any`. `tsc --noEmit` debe pasar.
- No instalar dependencias. No tocar rules ni .env.

## Tareas
- [ ] T1 servicio + hook Pedidos (compara mapa id→estado anterior vs nuevo; salta la primera carga; notifica "Tu pedido cambió a X"). Ruta: delegated.
- [ ] T2 guía E2E en este doc + verificación. Ruta: inline parent.

## Criterios de aceptación
- Con permiso concedido: negocio avanza estado → al cliente le entra notificación local con el nuevo estado.
- Con permiso denegado: sin notificación, sin crash, Pedidos sigue en vivo.
- Notificación solo por cambios reales, no una por pedido en cada apertura.

## E2E en físico (Expo Go, misma WiFi)
1. `npm run mock-api` (terminal 1) y `npx expo start -c` (terminal 2); abrir en físico con Expo Go.
2. Login cliente → aceptar permiso de notificaciones → agregar menú → confirmar.
3. Login negocio (otra sesión/otro celu o cerrar sesión) → tab Negocio → Avanzar estado.
4. Cliente: ve badge cambiar + entra notificación. Negocio: alta de producto visible en Detalle.

## Progreso
- 2026-10-07: doc creado. T1 implementado por writer (docs SDK 57 leídos).
- Evidencia: notificaciones.ts nuevo + hook en Pedidos sin spam en primera carga; `npx tsc --noEmit` pasa (writer + parent exit 0).
