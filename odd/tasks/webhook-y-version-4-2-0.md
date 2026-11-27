# Corregir webhook y versión 4.2.0

## Objetivo
Permitir que los webhooks de órdenes aprobadas de Mercado Pago se verifiquen correctamente y publicar la versión visible 4.2.0 de BarrioGo.

## Alcance autorizado
- Usar como manifiesto HMAC canónico de Orders `data.id` en minúsculas junto con el `x-request-id`; esta variante empíricamente comprobada en WEB-11 sustituye las implementaciones previas que preservaban la capitalización original.
- Permitir reconciliar pagos pendientes solo mediante una solicitud autenticada del propietario; el backend usa el `mpOrderId` guardado y consulta Mercado Pago.
- Actualizar la versión de la aplicación a 4.2.0 en la configuración correspondiente.
- Mantener el entorno sandbox y sus textos externos de Mercado Pago sin cambios.
- No tocar Firebase, seeds, reglas, mapas, checkout, credenciales ni secretos.

## Tareas
- [x] WEB-01 — Revisar configuración de versión y corregir firma del webhook. Route: delegated (two files). En esa implementación inicial, el manifiesto HMAC conservaba la capitalización original de `data.id`; ese comportamiento histórico fue sustituido por la variante canónica de WEB-11 (`data.id` en minúsculas + `x-request-id`). `app.json` version is `4.2.0`.
- [x] WEB-02 — Ejecutar verificaciones y documentar resultados. Route: delegated verification. `backend`: `npm run typecheck`, `npm run lint`, and `npm run build` passed. Root: `npx tsc --noEmit`, `npx expo lint`, and `git diff --check` passed; Git emitted only LF-to-CRLF normalization warnings for the two edited source/config files.
- [x] WEB-03 — Preparar commits y subir a apf4 con autorización del usuario. Implementación subida en `874df0d fix: validar webhook de Mercado Pago`.
- [x] WEB-04 — Restaurar entonces la capitalización original de `data.id` para la firma HMAC de Orders, conservando los requisitos de firma y la comparación timing-safe. Fue el comportamiento vigente tras WEB-04, pero WEB-11 lo sustituyó por la variante canónica empíricamente comprobada: `data.id` en minúsculas + `x-request-id`. Route: delegated (backend correction).
- [x] WEB-05 — Añadir `POST /api/payments/:paymentId/reconcile`; verifica propiedad, lee el `mpOrderId` almacenado y reutiliza la reconciliación transaccional tras consultar la orden oficial. La pantalla reconcilia tanto al abrirse como al usar “Consultar estado”, y luego vuelve a leer el estado; los errores conservan el estado actual y las respuestas obsoletas no actualizan la pantalla. Route: delegated (backend + frontend).
- [x] WEB-06 — Verificación local final (incluyendo reconciliación al abrir la pantalla) completada: backend typecheck/lint/build, TypeScript raíz, Expo lint y diff check pasaron. Implementación publicada con autorización en `c70cf5a fix: reconciliar pagos de Mercado Pago`. Route: delegated verification.
- [x] WEB-07 — Agregar diagnóstico seguro y categorizado de rechazo de firma webhook. Los rechazos se clasifican como secreto ausente, `x-signature` ausente/malformado, `data.id` ausente o firma incorrecta; el único warning emite solo la categoría y los rechazos mantienen HTTP 401. Route: delegated (backend + task tracking).
- [x] WEB-08 — Verificación local completada: `backend`: `npm run typecheck`, `npm run lint` y `npm run build` pasaron; `git diff --check` pasó. Diagnóstico publicado con autorización en `fe1f427 chore: diagnosticar firmas de webhook`. Route: delegated verification + inline repository operation.
- [x] WEB-09 — Añadir un evento estructurado único en rechazos, con señales no sensibles y coincidencias timing-safe para las variantes entonces investigadas: sin `request-id`, ID en minúsculas y secreto recortado. WEB-11 posteriormente estableció la variante canónica empíricamente comprobada (`data.id` en minúsculas + `x-request-id`); las coincidencias de WEB-09 son solo diagnósticas históricas. Los rechazos mantienen HTTP 401 y no se emiten diagnósticos en éxito. Route: delegated (backend).
- [x] WEB-10 — Verificación local completada: `backend`: `npm run typecheck`, `npm run lint` y `npm run build`; raíz: `git diff --check`. Publicado con autorización en `adf9144 chore: ampliar diagnóstico de firmas webhook`. Route: delegated verification + inline repository operation.
- [x] WEB-11 — Aplicar la variante HMAC comprobada: el manifiesto canónico usa `data.id` en minúsculas con `x-request-id`; se conserva el rechazo estricto HTTP 401 y el diagnóstico seguro con nombres que identifican cada variante sin ambigüedad. Evidencia: los logs de Render mostraron `lowercaseIdWithRequestId=true` y `canonicalRawId=false`. Route: delegated (backend).
- [x] WEB-12 — Verificar y publicar la corrección final en `apf4`. Verificación local completada: backend `npm run typecheck`, `npm run lint`, `npm run build` y `git diff --check` pasaron. Publicado con autorización en `a51ebb6 fix: validar firma de webhook de Mercado Pago`. Route: delegated verification + inline repository operation.

## Criterios de aceptación
- El HMAC canónico usa `data.id` en minúsculas y `x-request-id`; se conservan la validación estricta y la comparación timing-safe.
- La versión visible del APK es 4.2.0.
- No se eliminan etiquetas de sandbox del proveedor ni se alteran secretos.
- TypeScript, lint, build y diff check pasan.
- Un pago acreditado puede reconciliarse por POST autenticado del propietario al abrir la pantalla o consultar el estado, aunque un webhook anterior haya fallado; el servidor obtiene la orden oficial usando el ID guardado y los estados terminales son idempotentes.
