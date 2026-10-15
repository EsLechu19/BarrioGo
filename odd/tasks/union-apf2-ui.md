# Feature: union-apf2-ui (APF2 lógica + ui-consistencia diseño)

## Objetivo
Rama `feature/apf2-ui-unido` = base `origin/feature/ui-consistencia` (que ya incluye APF2→APF3→F6) con la lógica APF2 verificada intacta y solo la capa visual de los 6 commits UI.

## Regla del usuario
Lógica APF2 se mantiene; de ui-consistencia solo diseño/UX/UI.

## Mapa de los 6 commits UI (base 10c3bf7 → tip f21e1a8)
- 0baeb61 assets llama (solo assets, seguro).
- 7a604da `nombre?` opcional en ItemPedido + CartContext lo guarda (COMPATIBLE, se queda).
- f04fada 30 archivos nuevos (componentes/hooks/utils, aditivos) + modifica FormField, PrimaryButton, RestaurantCard, colors.
- 51e011d 9 pantallas nuevas + toca AppNavigator, RootStackParamList, TabNavigator.
- b41e864 reescribe 10 pantallas existentes (RIESGO: Carrito/Pedidos/Negocio/MiLocal/Detalle/Registrar/Perfil/Home/Favoritos/Splash).
- f21e1a8 reescribe Login/Register (RIESGO: auth + validación).

## Auditoría de lógica (obligatoria antes de cerrar)
- [ ] Checkout/escucha: Carrito llama crearPedido igual; Pedidos mantiene escucharMisPedidos + hook notifs sin spam.
- [ ] Negocio: NegocioScreen (pedidos + avance), MiLocal (update + fotos), Registrar (vínculo + refreshRol), refreshRol existe en AuthContext.
- [ ] Auth: login/register/validación/errores iguales; AuthContext intacto.
- [ ] RestaurantCard: guard uri vacía + portada (fix 81661c9 presente o repuesto).
- [ ] GPS: getUserCoords con caché + timeout (fix 933a8d6 presente).
- [ ] Fotos: subirFotoNegocio por Cloudinary base64 (commits f986b0e/92e4ea0 presentes).
- [ ] Assets: todo require de img existe (logos viejos eliminados).
- [ ] TabNavigator: tabs originales intactos + NegocioTab condicional.
- [ ] `npx tsc --noEmit` pasa.

## Criterios
- tsc pasa; cada marcador de lógica verificado por grep/lectura; divergencias reparadas con commits chicos.
- Push de la rama unida al final.

## Progreso
- 2026-10-11: rama creada desde ui-consistencia. Auditoría read-only (worker) 9/10 intacto.
- Única divergencia funcional reparada: CarritoScreen cobraba envío (TARIFA_ENVIO 5.0); revertido a total puro APF2. `7a604da` (nombre? opcional) se queda por compatible. tsc pasa.
