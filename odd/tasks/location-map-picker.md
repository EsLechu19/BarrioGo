# Selector de ubicación con mapa

## Objetivo
Permitir que clientes y dueños elijan ubicaciones con el mapa gratuito existente, sin campos visibles de latitud/longitud, y mostrar una distancia real en la información del negocio.

## Alcance autorizado
- Crear `src/components/MapaSelector.tsx` con MapLibre y OpenFreeMap existentes.
- Modificar el flujo de direcciones de cliente, carrito, formulario de negocio y detalle de negocio.
- Mantener compatibilidad con direcciones y pedidos antiguos sin coordenadas.

## Restricciones
- No tocar Firebase, reglas, seeds, `app.json`, dependencias, APK, commit ni push.
- No usar Google Maps, claves, facturación ni geocodificación externa.
- No mostrar coordenadas numéricas al usuario.

## Tareas
- [x] MAP-1 Crear selector reutilizable y adaptar la entrada de ubicación del dueño. Route: inline due to user-prohibited delegation; evidence: MapaSelector usa MapLibre/OpenFreeMap y UbicacionInput ya no renderiza campos numéricos.
- [x] MAP-2 Añadir coordenadas opcionales compatibles a direcciones y al snapshot del pedido. Route: inline due to user-prohibited delegation; evidence: DireccionUsuario y DireccionPedido admiten lat/lng opcionales y AsyncStorage acepta el formato anterior.
- [x] MAP-3 Integrar selección rápida de dirección en carrito y selección por mapa para cliente. Route: inline due to user-prohibited delegation; evidence: Home, Direcciones y Carrito usan UbicacionModal con MapaSelector; Carrito recarga la dirección activa al recibir foco.
- [x] MAP-4 Eliminar coordenadas visibles y calcular distancia real en detalle. Route: inline due to user-prohibited delegation; evidence: DetalleScreen calcula distancia con GPS y InfoTab solo la muestra si existe.
- [x] MAP-5 Ejecutar typecheck, lint y revisión del diff. Route: inline due to user-prohibited delegation; evidence: `npx tsc --noEmit`, `npx expo lint` y `git diff --check` terminaron correctamente.

## Criterios de aceptación
- Cliente y dueño nunca escriben ni ven latitud/longitud.
- Direcciones existentes sin coordenadas siguen funcionando.
- Carrito permite cambiar rápido la dirección sin perder productos.
- Información del negocio no muestra una distancia estática como si fuera real.
- No hay cambios fuera del alcance autorizado.

## Estado
- Implementación finalizada localmente el 2026-11-25.
- Commit omitido explícitamente por solicitud del usuario.
