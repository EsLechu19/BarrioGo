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
- [~] P0.3 Extender el payload para dirección y método de pago sin cambiar la distribución visual. Las pantallas actuales son mock y no se conectan automáticamente al checkout.
- [x] P0.4 Validar creación de pedido y compatibilidad con pedidos antiguos.
- [x] P0.6 Persistir cancelación del cliente y restringir transiciones de estado en Firestore.
- [x] P0.5 Verificar compilación y checks estáticos. El runtime Firebase/dispositivo queda pendiente si no hay configuración disponible.

## Restricciones

- No reemplazar pantallas APF2 completas.
- No cambiar colores, tema oscuro, componentes, assets, textos ni distribución.
- No presentar pagos ficticios como pasarela real.

## Evidencia

- TypeScript: `npx tsc --noEmit` PASS.
- Checks: `git diff --check` PASS; `node --check scripts/mock-server.js` PASS.
- UI APF2: Home, Configuracion, colors y RestaurantCard permanecen byte-identical al remoto.
- Runtime Firebase/dispositivo: no ejecutado; cancelación, reglas y listeners requieren Firebase configurado.
- Commit: pendiente (no se realizó commit por instrucción).
