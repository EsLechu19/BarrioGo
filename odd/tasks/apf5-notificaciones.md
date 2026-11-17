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

## E2E en físico (misma WiFi)

Las notificaciones **locales** funcionan en Expo Go; las **push remotas** no
(disponible en Expo Go desde SDK 53, docs v57). El canal y el sonido propios
(`barriogo-pedidos-v2`, `xd.wav`) y el ícono `noti.png` son ajustes de build
del plugin `expo-notifications`: en Expo Go se usa el canal y el sonido por
defecto del sistema.

Opción A — Expo Go (rápida, sin build):
1. `npm run mock-api` (terminal 1) y `npx expo start -c` (terminal 2); abrir en físico con Expo Go.
2. Login cliente → agregar menú → confirmar el pedido.
3. Login negocio (otra sesión u otro celu) → tab Negocio → avanzar estado.
4. Cliente: entra la notificación local con el mensaje del nuevo estado.

Opción B — dev build (verifica canal, sonido e ícono propios):
1. `npx expo run:android` (o `eas build -p android`) con el plugin de
   notificaciones aplicado; requiere `google-services.json` en la raíz.
2. Mismos pasos que la opción A.

En ambos casos: tocar la notificación abre el pedido en `PedidoDetalle`.

## Progreso
- 2026-10-07: doc creado. T1 implementado por writer (docs SDK 57 leídos).
- Evidencia: notificaciones.ts nuevo + hook en Pedidos sin spam en primera carga; `npx tsc --noEmit` pasa (writer + parent exit 0).
- 2026-10-21: se cierra el hueco de "¡Pedido realizado!" (nunca se disparaba:
  el bridge exigía un estado previo, así que el caso `pendiente` era código
  muerto). Ahora el aviso sale al confirmar el pedido en el carrito y también
  cuando el pedido aparece en otro dispositivo. Se agrega el aviso al negocio
  (pedido nuevo y cancelación del cliente), el toque de la notificación abre
  `PedidoDetalle`, el historial marca lo leído y la campana de Inicio muestra
  el contador de no leídas. El gate de Expo Go pasó de
  `Constants.appOwnership` (ya no viaja en expo-constants 57) a
  `isRunningInExpoGo()`; en Expo Go quedan activas las locales con canal y
  sonido por defecto.
