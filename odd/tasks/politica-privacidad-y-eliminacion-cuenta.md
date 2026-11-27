# Política de privacidad y eliminación de cuenta

## Objetivo
Crear páginas públicas para la ficha de Google Play que expliquen el tratamiento de datos de BarrioGo y el proceso de solicitud de eliminación de cuenta.

## Alcance autorizado
- Crear una política de privacidad y una página de solicitud de eliminación para GitHub Pages.
- Usar el correo de soporte autorizado por el usuario: `jotah26.dev@gmail.com`.
- Definir el proceso manual de solicitud, verificación y retención de datos de pedidos.

## Restricciones
- No cambiar código de la app, Firebase, reglas, backend ni secretos.
- No afirmar que existe borrado automático si no está implementado.
- No incluir `tmp_docx_media/`.

## Tareas
- [x] PRIV-01 — Crear páginas estáticas de privacidad y eliminación. Ruta: delegated (dos documentos HTML).
- [x] PRIV-02 — Revisar el contenido, verificar enlaces y hacer commit local. Ruta: delegated.
- [ ] PRIV-03 — Publicar en GitHub Pages cuando el usuario autorice el push y active Pages. Ruta: pending user authorization.

## Criterios de aceptación
- Las páginas mencionan BarrioGo, el correo de soporte y un flujo claro de solicitud.
- La eliminación describe datos eliminados, datos retenidos y plazo de retención.
- La política declara los servicios externos usados por la aplicación.

## Progreso
- `docs/privacy.html`: datos y servicios verificados, pagos de prueba y enlace a eliminación.
- `docs/delete-account.html`: solicitud manual desde el correo registrado, asunto definido, alcance del borrado y retención de pedidos/pagos durante 90 días.
- Verificación: existencia y contenido de ambos HTML, enlaces relativos, correo/asunto y `git diff --check` / `git diff --cached --check`.
- Un commit local; no se publicaron las páginas. La URL pública y cualquier enlace dentro de la app quedan pendientes de autorización y están fuera de este cambio.
- Siguiente paso: autorizar push a GitHub, configurar GitHub Pages y comprobar las URLs públicas antes de usarlas en Google Play.
