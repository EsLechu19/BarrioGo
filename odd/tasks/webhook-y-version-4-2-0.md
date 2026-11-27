# Corregir webhook y versión 4.2.0

## Objetivo
Permitir que los webhooks de órdenes aprobadas de Mercado Pago se verifiquen correctamente y publicar la versión visible 4.2.0 de BarrioGo.

## Alcance autorizado
- Normalizar el identificador de orden de Mercado Pago a minúsculas solo para validar la firma HMAC.
- Actualizar la versión de la aplicación a 4.2.0 en la configuración correspondiente.
- Mantener el entorno sandbox y sus textos externos de Mercado Pago sin cambios.
- No tocar Firebase, seeds, reglas, mapas, checkout, credenciales ni secretos.

## Tareas
- [x] WEB-01 — Revisar configuración de versión y corregir firma del webhook. Route: delegated (two files). `data.id` is lowercased only in the HMAC manifest; `app.json` version is `4.2.0`.
- [x] WEB-02 — Ejecutar verificaciones y documentar resultados. Route: delegated verification. `backend`: `npm run typecheck`, `npm run lint`, and `npm run build` passed. Root: `npx tsc --noEmit`, `npx expo lint`, and `git diff --check` passed; Git emitted only LF-to-CRLF normalization warnings for the two edited source/config files.
- [x] WEB-03 — Preparar commits y subir a apf4 con autorización del usuario. Implementación subida en `874df0d fix: validar webhook de Mercado Pago`.

## Criterios de aceptación
- El ID alfanumérico del webhook se normaliza conforme a Mercado Pago antes del HMAC.
- La versión visible del APK es 4.2.0.
- No se eliminan etiquetas de sandbox del proveedor ni se alteran secretos.
- TypeScript, lint, build y diff check pasan.
