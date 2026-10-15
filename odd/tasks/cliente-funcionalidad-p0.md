# Funcionalidad real del cliente

## Objetivo

Completar el flujo del cliente sin alterar el diseño visual de `origin/feature/apf2-ui-unido`, empezando por carrito y checkout.

## Alcance

- Rama: `feature/apf2-apf3-ui-final`.
- UI y estilos: APF2 remoto, preservados.
- Lógica: servicios/contextos/hooks de APF3 y validaciones necesarias.
- No incluir secretos ni modificar archivos `.env` o `service-account.json`.

## Tareas

- [x] P0.1 Guardar `negocioId` y snapshot suficiente en cada item del carrito.
- [x] P0.2 Impedir mezcla de restaurantes antes de confirmar, con reemplazo explícito.
- [x] P0.3 Persistir por `uid` la dirección y el método de pago demo seleccionados, cargarlos al confirmar y extender el payload sin cambiar la distribución visual. No se implementa una pasarela real.
- [x] P0.4 Validar creación de pedido y compatibilidad con pedidos antiguos.
- [x] P0.6 Persistir cancelación del cliente y restringir transiciones de estado en Firestore.
- [x] P0.5 Verificar compilación y checks estáticos. El runtime Firebase/dispositivo queda pendiente si no hay configuración disponible.
- [x] P0.10 Validar productos, restaurante y total calculado antes de crear pedidos; la validación server-side definitiva requiere backend confiable o Cloud Function.
- [x] P0.11 Guiar desde `Confirmar pedido` a la selección faltante de dirección o método de pago antes de crear el pedido en Firestore.
- [x] P0.7 Persistir el historial local de notificaciones del cliente, aislado por usuario y alimentado por cambios reales de estado/cancelación del listener de pedidos.
- [x] P0.8 Persistir teléfono de perfil y preferencias del cliente por `uid`, sin alterar la UI APF2. El permiso de notificaciones se solicita solo al activar la preferencia; no se implementa push remoto.
- [x] P0.9 Persistir por `uid` las selecciones demo de checkout y bloquear confirmaciones sin dirección o método de pago.

## Restricciones

- No reemplazar pantallas APF2 completas.
- No cambiar colores, tema oscuro, componentes, assets, textos ni distribución.
- No presentar pagos ficticios como pasarela real.

## Evidencia

- TypeScript: `npx tsc --noEmit` PASS.
- Checks: `git diff --check` PASS; `node --check scripts/mock-server.js` PASS.
- UI APF2: Home, Configuracion, colors y RestaurantCard permanecen byte-identical al remoto.
- Runtime Firebase/dispositivo: no ejecutado; cancelación, reglas y listeners requieren Firebase configurado.
- Notificaciones: el historial local sí queda persistido por `uid`; el aviso del sistema es opcional y local. No se implementó push remoto. Expo Go no garantiza el módulo de notificaciones del sistema; se requiere un development build para validar el comportamiento nativo.
- Commit: pendiente (no se realizó commit por instrucción).
- Perfil: nombre, correo y año mostrado siguen siendo de solo lectura; solo se persiste el teléfono que ya tenía input. El cambio de contraseña usa Firebase Auth y puede requerir una sesión reciente.
- Ubicación y ofertas: sus preferencias quedan persistidas, pero no se fuerza el GPS ni existe un canal remoto de ofertas en este work unit.
- Checkout: dirección y método de pago son datos demo locales; no se procesa precio en servidor ni se integra una pasarela de pagos.
