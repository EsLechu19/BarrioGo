# Pago confirmado y cancelación segura

## Objetivo
Evitar notificaciones de pedido antes de confirmar un pago Mercado Pago y bloquear cancelaciones locales inseguras mientras un pago está pendiente o ya fue aprobado.

## Alcance autorizado
- Enviar al cliente, al confirmarse el pago, solo: `Pago aprobado. Tu pedido fue enviado`.
- No enviar el aviso nativo de pedido recibido para pedidos Mercado Pago pendientes.
- Mantener el flujo actual de efectivo/Yape.
- Evitar que la UI permita cancelar un pedido Mercado Pago pendiente con checkout activo o ya pagado.

## Restricciones
- No tocar Firebase rules, deploy, APK, secretos ni mapas.
- No incluir `tmp_docx_media/`.

## Tareas
- [x] PAY-01 — Mapear los puentes de notificaciones y los puntos de cancelación. Ruta: delegated (varios archivos). Evidencia: `CarritoScreen`, `CustomerNotificationBridge`, `notificaciones`, `storage`, `PedidosScreen`, `PedidoDetalleScreen`, `api` y reglas existentes.
- [x] PAY-02 — Implementar la notificación posterior a pago y la protección de cancelación. Ruta: delegated (varios archivos).
- [x] PAY-03 — Ejecutar verificaciones aplicables y publicar en `apf4`. Ruta: delegated. Evidencia: comprobaciones correctas; commit y push a `origin apf4` de esta unidad.

## Criterios de aceptación
- Pedido Mercado Pago pendiente: sin notificación nativa de «Pedido recibido».
- Pago confirmado: el cliente recibe exactamente «Pago aprobado. Tu pedido fue enviado».
- Efectivo/Yape conservan su aviso actual.
- La app no muestra un estado cancelado que Firestore rechaza.
- TypeScript y lint aplicables no agregan errores.

## Progreso
PAY-01 y PAY-02 completadas. El aviso temprano nacía en `CarritoScreen` y en el puente del cliente; ahora Mercado Pago solo registra el aviso exacto al observar `estadoPago: pagado`. El historial deduplica por identificador de evento, por lo que el aviso de pago no colisiona con un posterior cambio de estado del pedido. Efectivo/Yape conservan su aviso de creación. Lista y detalle ocultan la cancelación de Mercado Pago con pago pendiente/aprobado o checkout activo; el servicio comprueba el documento dentro de una transacción. El listener del cliente omite snapshots con escrituras locales sin confirmar para no mostrar una cancelación que las reglas reviertan.

## Archivos de esta unidad
- `src/screens/CarritoScreen.tsx` — omite el aviso prematuro para Mercado Pago.
- `src/components/CustomerNotificationBridge.tsx` — detecta la transición de pago aprobado.
- `src/services/notificaciones.ts`, `src/services/storage.ts` — texto exacto y deduplicación del aviso.
- `src/types/Pedido.ts`, `src/services/api.ts` — reserva de checkout tipada, cancelación validada en transacción y listener sin escrituras locales pendientes.
- `src/screens/PedidosScreen.tsx`, `src/screens/PedidoDetalleScreen.tsx` — control de cancelación y explicación al cliente.
- `odd/tasks/pago-confirmado-y-cancelacion-segura.md` — progreso y evidencia.

## Verificación prevista
- `npx tsc --noEmit` — pasó.
- `npx expo lint` — pasó.
- `git diff --check` — pasó.
- Prueba en dispositivo del cambio de pago y de la cancelación: pendiente (no hay dispositivo ni transacción de prueba autorizada en esta ejecución).

## Límite de reversión
Revertir esta unidad restaura los avisos y la cancelación previos; no contiene cambios de backend, reglas, mapas ni configuración. El aviso local requiere que la app observe el cambio de pago; no sustituye un push remoto cuando la app está cerrada.
