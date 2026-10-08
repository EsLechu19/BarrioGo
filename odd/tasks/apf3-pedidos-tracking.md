# Feature: apf3-pedidos-tracking (F3 Pedidos con tracking)

## Objetivo
Cliente crea pedido real desde carrito -> se guarda en Firestore `pedidos` -> ve tracking en tiempo real del EstadoPedido.

## Problema
- `CarritoScreen.handleConfirmar` solo hace `console.log + clear + navigate`. No crea pedido.
- `PedidosScreen` es placeholder estático, sin listener.
- `api.ts` solo tiene catálogo (getNegocios/getMenu). Sin crearPedido ni listener.
- `CartContext` no guarda negocioId; hay que inferirlo y validar carrito single-negocio.

## Por qué
APF3 exige persistencia real 30% + tracking. F1 Auth ✔ y F2 catálogo ✔ ya están. Sin F3 no hay flujo de compra.

## Alcance
- IN: `src/services/api.ts` (crearPedido + escucharMisPedidos), `CarritoScreen` checkout real, `PedidosScreen` listener + UI estados.
- OUT: F4 panel negocio (cambiar estados), F5 notificaciones, reglas finas por rol, pago.

## Restricciones
- Toda llamada Firestore pasa por `api.ts`. Ninguna pantalla usa Firestore directo.
- Tipos del dominio solo en `src/types`. Estado: `pendiente | confirmado | en_camino | entregado`.
- Validar formularios/datos antes de enviar. Capturar errores red/hardware, nunca crashear.
- `firestore.rules` actual ya permite `pedidos` a autenticados — no tocar rules en F3.
- TypeScript estricto, sin `any`. `tsc --noEmit` debe pasar.

## Tareas
- [ ] T1 api.ts: `crearPedido(input)` con `addDoc(pedidos)` + validación + `escucharMisPedidos(uid, cb)` con `onSnapshot(query where usuarioId)`. Ruta: delegated (writer trigger: 2+ archivos no triviales).
- [ ] T2 CarritoScreen: checkout real (uid de Auth, negocioId inferido de productos, total, loading/error, clear solo si éxito). Ruta: delegated (mismo writer).
- [ ] T3 PedidosScreen: listener tiempo real + FlatList con badge estado + vacíos/errores/loading. Ruta: delegated (mismo writer).

## Criterios de aceptación
- Carrito con sesión iniciada -> Confirmar crea doc en `pedidos` con `usuarioId, negocioId, items, total, estado:'pendiente', fecha:ISO`.
- Sin sesión -> pide login, no crea pedido fantasma.
- Pedidos muestra la lista del usuario y cambia sola cuando el estado cambia en Firestore (sin reload).
- `npx tsc --noEmit` pasa. Errores de red se muestran, no crashean.

## Checks aplicables
- `npx tsc --noEmit` (obligatorio antes de commit)
- Prueba manual: login real -> agregar menú -> confirmar -> ver en Pedidos + ver doc en consola Firestore.

## Progreso
- 2026-10-07: doc creado post-mapeo. T1+T2+T3 implementados por writer único.
- Evidencia: api.ts crearPedido+escucharMisPedidos, CarritoScreen checkout real, PedidosScreen listener; `npx tsc --noEmit` pasa (exit 0). Review nativa: lens review-reliability declarado unachievable (runtime free-tier bloquea subagente review) — stop `unachievable_lens_slot`, sin receipt.
- Siguiente: commit work-unit + prueba manual en Expo Go (login -> confirmar -> ver en Pedidos/Firestore).

## Siguiente paso
- Delegar writer único T1+T2+T3 (route: delegated, trigger: writer 2+ files).
