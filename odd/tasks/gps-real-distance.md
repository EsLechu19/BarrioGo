# Distancias GPS reales

## Objetivo
Mostrar únicamente distancias calculadas con la ubicación real del dispositivo y dejar la experiencia recuperable cuando falte permiso o señal.

## Alcance autorizado
- `src/hooks/useUbicacion.ts`
- `src/screens/HomeScreen.tsx`
- `src/screens/RestaurantsScreen.tsx`
- `src/screens/FavoritosScreen.tsx`
- `src/components/RestaurantCard.tsx` solo para el renderizado ya iniciado

## Restricciones
- Sin Firebase, seeds, `app.json`, dependencias, commit, push ni APK.
- Mantener ocultas las distancias estáticas cuando no haya coordenadas.

## Tareas
- [x] GPS-1 Corregir el hook compartido: solicitud inicial de permiso, ajustes, reintento y protección ante desmontaje. Route: inline; evidence: `getUserCoords()` se ejecuta antes de clasificar el permiso y `abrirAjustes` depende de `estado === 'sin_permiso'`.
- [x] GPS-2 Corregir la carga inicial de Restaurantes y limpiar los errores de lint relacionados. Route: inline; evidence: la carga se difiere con timeout y depende de `load`.
- [x] GPS-3 Simplificar los estados sin coordenadas, verificar tipo/lint y revisar el diff final. Route: inline; evidence: `npx tsc --noEmit` y `npx expo lint` finalizaron con código 0; lint conserva solo 3 warnings preexistentes.

## Criterios de aceptación
- `getUserCoords()` es el primer paso de cada consulta GPS.
- El permiso denegado permite abrir Ajustes; la falta de señal permite reintentar.
- `npx tsc --noEmit` y `npx expo lint` no tienen errores.

## Estado
- Verificado el 2026-11-21. No se realizó commit, push ni build.
