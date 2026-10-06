# Feature: apf2-detalle-carrito-tabs

## Objetivo
Cerrar APF2 cliente: Home → Detalle (menú) → Carrito + Tabs (Inicio/Pedidos/Favoritos/Perfil), todo consumiendo la API local vía `api.ts`.

## Por qué
Rúbrica APF2 (navegación 25%, estados/eventos 25%) + Cap. III del informe ejemplo. Sin esto el flujo se queda en vitrina.

## Alcance autorizado
- `TabParamList` + `TabNavigator` (se instaló `@react-navigation/bottom-tabs` con aviso al equipo).
- `DetalleScreen({ negocioId })`: header negocio + menú FlatList + agregar al carrito.
- `CartContext`: items, cantidades, total; `CarritoScreen` con quitar/actualizar/vaciar.
- `Pedidos/Favoritos/Perfil`: pantallas simples reales (no lorem), Favoritos con corazón funcional en memoria.
- `api.ts`: `getMenu(negocioId)`, `getNegocioById(id)` con mismo fallback offline.
- NO auth real, NO GPS, NO AsyncStorage (siguiente feature).
- NO tocar Login/Register/Splash salvo navegación.

## Checklist
- [x] T1: datos + api (`productosMock`, `getMenu`, `getNegocioById`)
- [x] T2: carrito (`CartContext` + provider en App + `CarritoScreen`)
- [x] T3: navegación (Tabs + Stack Detalle/Carrito + Home navegable + heart favoritos)
- [x] T4: verificación (`tsc` OK + flujo manual Home→Detalle→Carrito)

## Evidencia
- Rama `feature/apf2-detalle-carrito-tabs`: `dd59a36 feat(api)`, `7840745 feat(cart)`, `97f9563 feat(nav)`
- `npx tsc --noEmit`: TSC-OK
- Se instaló `@react-navigation/bottom-tabs` (avisado al equipo, queda en package.json)

## Criterios de aceptación
- Agregar/quitar actualiza total en pantalla; carrito vacío muestra estado vacío.
- Tabs cambian de pantalla; back funciona; `tsc` sin errores.

## Mapeo al informe
- 3.1 RF: ver menú, armar carrito, favoritos. RNF: total siempre consistente.
- 3.2: Stack anidado en Tabs; 3.3: Context + Hooks + fetch; IV: capturas Detalle/Carrito.
