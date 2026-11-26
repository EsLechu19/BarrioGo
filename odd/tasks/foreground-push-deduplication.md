# Evitar notificaciones duplicadas en primer plano

## Objetivo
Cuando la app está abierta, mostrar solo la notificación local generada por los bridges y silenciar el push remoto equivalente. En segundo plano, conservar el push remoto nativo.

## Alcance autorizado
- `src/services/notificaciones.ts`
- `scripts/servidor-notificaciones.js`

## Restricciones
- No cambiar el despliegue del servidor ni ejecutar `npm run notificaciones`.
- No modificar Firebase, reglas, app.json, permisos, sonidos, pedidos, commit, push ni APK.

## Tareas
- [x] PUSH-DEDUP-1 Marcar explícitamente avisos locales y remotos en `data`. Evidence: `origen: 'local'` y `origen: 'remota'`.
- [x] PUSH-DEDUP-2 Configurar el handler de primer plano para ocultar solo los remotos y conservar los locales. Evidence: `handleNotification` decide por `data.origen`.
- [x] PUSH-DEDUP-3 Verificar tipos, lint y diff. Evidence: TypeScript, lint, node --check y diff --check terminaron con código 0.

## Criterios de aceptación
- App abierta: un pedido produce una sola alerta visible.
- App en segundo plano: el push remoto conserva su presentación nativa.
- TypeScript y lint sin errores.

## Estado
- Falta prueba manual en la APK final con el servidor de notificaciones encendido.
- No se ejecutó el servidor, commit, push ni build.
