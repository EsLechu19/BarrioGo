# Feature: apf4-panel-negocio (F4 Panel negocio)

## Objetivo
El dueño ve los pedidos de SU negocio en tiempo real, cambia estados (pendiente→confirmado→en_camino→entregado) y da de alta productos simples en su menú.

## Problema
- No hay pantalla negocio. Tabs fijas (Inicio/Pedidos/Favoritos/Perfil), sin branch por rol.
- `api.ts` no tiene `escucharPedidosNegocio`, `cambiarEstadoPedido` ni `crearProducto`.
- `register` siempre crea `rol:'cliente'`; el rol negocio hoy solo se setea manual en consola Firestore.
- Foto: image-picker ya es dependencia (F0), pero no hay Storage configurado; subir foto real excede este slice.

## Por qué
Sin F4, el tracking F3 nunca cambia de `pendiente` y el flujo APF3 queda a medias.

## Alcance
- IN: api negocio + `NegocioScreen` (mis pedidos con botones de estado + alta producto nombre/precio/descripción) + tab Negocio visible solo si `rol==='negocio'`.
- OUT: foto subida a Storage, edición/borrado de producto, reglas finas por negocio, notificaciones (F5).

## Supuestos (visibles, baratos de revertir)
- El vínculo usuario→negocio vive en `users/{uid}` con campos `rol:'negocio'` + `negocioId:'1'`, seteados manual en consola. Si faltan, la pantalla lo explica en vez de crashear.
- Foto queda OUT de este slice; el alta guarda `imagenUrl:''` y Detalle ya tiene fallback.

## Restricciones
- Todo Firestore pasa por `api.ts`. Tipos solo en `src/types`. Sin `any`. `tsc --noEmit` debe pasar.
- No tocar `firestore.rules` (ya permite pedidos a autenticados). No instalar dependencias nuevas.
- Errores de red siempre capturados y visibles.

## Tareas
- [ ] T1 api.ts: `escucharPedidosNegocio(negocioId, cb, onError)` (where negocioId, sort memoria), `cambiarEstadoPedido(pedidoId, estado)` (updateDoc + validación), `crearProducto(input)` (addDoc productos + validación). Ruta: delegated.
- [ ] T2 NegocioScreen nueva + tab condicional en TabNavigator (useAuth rol). Sin rol negocio → mensaje cómo habilitarse (consola: users/{uid} rol + negocioId). Form alta valida nombre/precio antes de enviar. Ruta: delegated (mismo writer).

## Criterios de aceptación
- Usuario con `rol:'negocio'` + `negocioId` ve solo pedidos de su negocio en tiempo real.
- Botón de estado avanza el pedido; el cliente lo ve cambiar en Pedidos sin reload.
- Alta con nombre + precio > 0 crea doc en `productos` con ese negocioId y aparece en Detalle.
- Sin rol/negocioId → mensaje guía, nunca pantalla en blanco ni crash.

## Checks
- `npx tsc --noEmit` (obligatorio). Manual: cliente crea → negocio cambia → cliente ve.

## Progreso
- 2026-10-07: doc creado. T1+T2 implementados por writer único.
- Evidencia: api.ts escucharPedidosNegocio+cambiarEstadoPedido+crearProducto, NegocioScreen nueva, tab Negocio solo si rol==='negocio'; `npx tsc --noEmit` pasa (exit 0, verificado por parent).
- Review nativa: lens no disponible en este runtime (precedente F3 unachievable_lens_slot); verificación de registro = tsc + spot-check parent.

## Siguiente paso
- Delegar writer único T1+T2 (route: delegated, trigger: writer 2+ files).
