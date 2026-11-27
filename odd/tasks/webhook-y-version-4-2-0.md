# Corregir webhook y versión 4.2.0

## Objetivo
Permitir que los webhooks de órdenes aprobadas de Mercado Pago se verifiquen correctamente y publicar la versión visible 4.2.0 de BarrioGo.

## Alcance autorizado
- Preservar la capitalización recibida de `data.id` en el manifiesto HMAC de Orders.
- Permitir reconciliar pagos pendientes solo mediante una solicitud autenticada del propietario; el backend usa el `mpOrderId` guardado y consulta Mercado Pago.
- Actualizar la versión de la aplicación a 4.2.0 en la configuración correspondiente.
- Mantener el entorno sandbox y sus textos externos de Mercado Pago sin cambios.
- No tocar Firebase, seeds, reglas, mapas, checkout, credenciales ni secretos.

## Tareas
- [x] WEB-01 — Revisar configuración de versión y corregir firma del webhook. Route: delegated (two files). El manifiesto HMAC conserva la capitalización original de `data.id`; `app.json` version is `4.2.0`.
- [x] WEB-02 — Ejecutar verificaciones y documentar resultados. Route: delegated verification. `backend`: `npm run typecheck`, `npm run lint`, and `npm run build` passed. Root: `npx tsc --noEmit`, `npx expo lint`, and `git diff --check` passed; Git emitted only LF-to-CRLF normalization warnings for the two edited source/config files.
- [x] WEB-03 — Preparar commits y subir a apf4 con autorización del usuario. Implementación subida en `874df0d fix: validar webhook de Mercado Pago`.
- [x] WEB-04 — Restaurar la capitalización original de `data.id` para la firma HMAC de Orders, conservando los requisitos de firma y la comparación timing-safe. Route: delegated (backend correction).
- [x] WEB-05 — Añadir `POST /api/payments/:paymentId/reconcile`; verifica propiedad, lee el `mpOrderId` almacenado y reutiliza la reconciliación transaccional tras consultar la orden oficial. La pantalla reconcilia tanto al abrirse como al usar “Consultar estado”, y luego vuelve a leer el estado; los errores conservan el estado actual y las respuestas obsoletas no actualizan la pantalla. Route: delegated (backend + frontend).
- [x] WEB-06 — Verificación local final (incluyendo reconciliación al abrir la pantalla) completada: backend typecheck/lint/build, TypeScript raíz, Expo lint y diff check pasaron. Implementación publicada con autorización en `c70cf5a fix: reconciliar pagos de Mercado Pago`. Route: delegated verification.
- [x] WEB-07 — Agregar diagnóstico seguro y categorizado de rechazo de firma webhook. Los rechazos se clasifican como secreto ausente, `x-signature` ausente/malformado, `data.id` ausente o firma incorrecta; el único warning emite solo la categoría y los rechazos mantienen HTTP 401. Route: delegated (backend + task tracking).
- [x] WEB-08 — Verificación local completada: `backend`: `npm run typecheck`, `npm run lint` y `npm run build` pasaron; `git diff --check` pasó. Diagnóstico publicado con autorización en `fe1f427 chore: diagnosticar firmas de webhook`. Route: delegated verification + inline repository operation.

## Criterios de aceptación
- El HMAC usa la capitalización original recibida para `data.id`; se conserva la validación estricta y timing-safe.
- La versión visible del APK es 4.2.0.
- No se eliminan etiquetas de sandbox del proveedor ni se alteran secretos.
- TypeScript, lint, build y diff check pasan.
- Un pago acreditado puede reconciliarse por POST autenticado del propietario al abrir la pantalla o consultar el estado, aunque un webhook anterior haya fallado; el servidor obtiene la orden oficial usando el ID guardado y los estados terminales son idempotentes.
