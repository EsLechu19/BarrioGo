# Endurecimiento de reglas de pedidos

## Objetivo
Evitar que clientes autenticados creen pedidos con campos inesperados, negocio inexistente, forma inválida o importes inválidos.

## Alcance autorizado
- `firestore.rules`

## Decisión de pagos
- Mantener temporalmente `estadoPago` simulado hasta integrar la pasarela sandbox.
- No presentarlo como prueba de un cobro real.

## Restricciones
- No publicar reglas en Firebase, no modificar API, pagos, servidor, app.json, dependencias, commit, push ni APK.
- No afirmar validación de catálogo/precio total por item: Security Rules no puede iterar de forma segura una lista arbitraria de ítems contra Firestore.

## Tareas
- [x] RULES-1 Validar estructura permitida y obligatoria del pedido. Evidence: `hasAll` y `hasOnly` en `esPedidoNuevoValido`.
- [x] RULES-2 Validar negocio existente, identidad, importes, dirección, método de pago y estado inicial. Evidence: validadores y `exists` de negocio.
- [x] RULES-3 Verificar sintaxis local y documentar la limitación de catálogo/pagos. Evidence: revisión estructural, `git diff --check`, TypeScript y lint; Firebase CLI no está instalado para validar/publicar Rules localmente.

## Criterios de aceptación
- Se rechazan campos extra, negocio inexistente, total no positivo y datos básicos malformados.
- Se preserva el flujo actual de pago simulado.
- Las reglas quedan listas para publicar manualmente, sin alterar Firebase remoto.

## Estado
- No se publicaron reglas en Firebase.
- `estadoPago` queda simulado hasta la pasarela sandbox.
- Falta validar y publicar desde Firebase Console o Firebase CLI antes de confiar en estas reglas en producción.
