# Sincronizar dirección y mapa

## Objetivo
Permitir que la persona escriba una dirección y vea el pin en el mapa, o elija un punto en el mapa y reciba una dirección aproximada, sin mostrar coordenadas.

## Alcance autorizado
- Implementar geocodificación directa e inversa con manejo de errores y caché.
- Conectar el flujo con los componentes y pantallas de dirección existentes.
- Mantener las coordenadas como datos internos.
- No modificar Firebase, Render, Mercado Pago, seeds ni APK.

## Tareas
- [x] MAP-01 — Mapear los consumidores actuales de dirección y mapa. Route: delegated (multiple files). Exploración: `MapaSelector` lo usan `DireccionesScreen`, `UbicacionModal` (desde Home y carrito), `MiLocalScreen` y `RegistrarNegocioScreen`; `UbicacionInput` solo se usa en las dos pantallas de negocio. Las coordenadas se guardan opcionalmente en `DireccionUsuario` y `DireccionPedido`, por lo que las direcciones antiguas pueden carecer de ellas. `HomeScreen` y `CarritoScreen` consumen el modal; detalles del negocio muestran direcciones y mapas estáticos, sin editar la dirección.
- [x] MAP-02 — Añadir servicio seguro de geocodificación y sincronizar los flujos de dirección/mapa. Route: delegated (multiple non-trivial files). Se integró Nominatim de OpenStreetMap desde `src/services/geocoding.ts`, con validación, codificación URI, cachés en memoria con TTL/límite, serialización a una petición por segundo, timeout, User-Agent de aplicación y fallos best-effort. `MapaSelector` bloquea confirmar mientras la búsqueda directa está en curso; si falla o no encuentra resultados, requiere seleccionar expresamente un pin o usar GPS antes de confirmar, así no persiste coordenadas predeterminadas/obsoletas. La dirección solo se reemplaza tras resolver correctamente el texto o una selección explícita manual/GPS.
- [x] MAP-03 — Ejecutar typecheck y lint; documentar resultados. Route: delegated verification. Evidencia final: `npx tsc --noEmit` pasó; `npx expo lint` pasó; `git diff --check` pasó (Git solo informó avisos de normalización LF→CRLF en dos archivos).

## Criterios de aceptación
- Confirmar un pin completa o actualiza la dirección con un resultado aproximado.
- Una dirección escrita centra el selector con el pin correspondiente.
- Si no hay resultado o red, se conserva el texto y se permite elegir manualmente en el mapa.
- No hay coordenadas visibles en la interfaz.
- No se modifica infraestructura externa ni se realiza commit/push.

## Progreso
MAP-01, MAP-02 y MAP-03 completados. Seguimiento de revisión independiente: se cerró la carrera entre búsqueda directa y Confirmar; el caso sin resultado conserva el texto y bloquea Confirmar hasta que se seleccione un pin/GPS, evitando persistir coordenadas predeterminadas/obsoletas. Verificación repetida tras las correcciones: `npx tsc --noEmit`, `npx expo lint` y `git diff --check` pasaron. No se instalaron dependencias ni se modificó infraestructura externa. Implementación registrada en `466e089 feat: sincronizar dirección con mapa` y subida a `apf4` con autorización posterior del usuario.
