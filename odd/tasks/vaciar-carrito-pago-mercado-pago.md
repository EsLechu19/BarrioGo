# Vaciar carrito al iniciar checkout Mercado Pago

## Objetivo
Evitar que productos ya convertidos en pedidos sigan en el carrito local tras un checkout de Mercado Pago.

## Alcance autorizado
- Limpiar y persistir el carrito inmediatamente después de crear pedidos y antes de abrir el checkout.
- No restaurar los productos ante un fallo posterior del navegador/pago, para impedir pedidos duplicados.
- Mantener el pedido pendiente y el flujo de reintento existente.

## Restricciones
- No tocar backend, Render, Firebase rules, Mercado Pago, secretos ni `tmp_docx_media/`.

## Tareas
- [x] CART-01 — Aplicar limpieza persistida previa al checkout. Ruta: delegated (Carrito, contexto y persistencia).
- [x] CART-02 — Ejecutar verificaciones y hacer commit local. Ruta: delegated. Evidencia: TypeScript, Expo lint y diff check correctos; commit local de esta unidad (sin push).

## Criterios de aceptación
- Tras crear pedidos para Mercado Pago, el carrito no vuelve a mostrar esos productos, aunque se cierre el navegador o se reinicie la app.
- Los pedidos creados permanecen disponibles para retomar/consultar el pago.
- No se agregan errores de TypeScript o lint.

## Progreso
`CarritoScreen` espera a que `CartContext.clearAndPersist()` vacíe memoria y AsyncStorage antes de abrir el navegador de Mercado Pago. Si la creación posterior del pago falla, el pedido ya guardado no devuelve sus productos al carrito; la ruta de error vuelve a intentar persistir el vacío e informa que no se debe confirmar otra vez. Las escrituras del carrito quedan serializadas para que una escritura antigua no sobreescriba el vacío. El flujo no-MP conserva su limpieza anterior.

## Archivos
- `src/screens/CarritoScreen.tsx` — limpieza confirmada antes del navegador y salida sin restaurar productos.
- `src/context/CartContext.tsx` — operación `clearAndPersist` para estado y almacenamiento.
- `src/services/storage.ts` — cola de escrituras del carrito con error observable por el checkout.
- `odd/tasks/vaciar-carrito-pago-mercado-pago.md` — evidencia de la unidad.

## Verificación
- `npx tsc --noEmit` — pasó.
- `npx expo lint` — pasó.
- `git diff --check` — pasó.
- Prueba de ciclo de vida en dispositivo — no disponible en esta ejecución; no hay harness de pruebas del carrito configurado.

## Límite de reversión
Revertir esta unidad restaura únicamente el vaciado posterior al navegador y la persistencia anterior del carrito; no modifica pedidos, pagos, backend ni reglas.
