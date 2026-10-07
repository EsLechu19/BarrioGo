# BarrioGo

Aplicación móvil multiplataforma para la gestión de pedidos directos entre
negocios gastronómicos de barrio (pollerías, chifas, menús) y sus clientes
recurrentes en Lima Metropolitana.

## Propuesta de valor

Las plataformas de delivery masivas cobran 25%–35% por pedido, incluso a
clientes que el negocio ya tenía. BarrioGo es un canal directo con
suscripción fija o comisión reducida (8%–12%): el negocio gestiona su
catálogo y sus pedidos; el cliente pide y sigue su pedido en tiempo real.

> No competimos por captar clientes nuevos; optimizamos y rentabilizamos
> la relación con los clientes que el negocio ya tenía.

## Stack

- React Native + Expo (SDK 57) + TypeScript estricto
- React Navigation (Stack + Bottom Tabs, sin Expo Router)
- Firebase (Auth + Firestore) como backend
- AsyncStorage para persistencia local
- Expo Location / Image Picker / Notifications para hardware

## Estructura

```
App.tsx                  Raíz: providers + navegación condicional por sesión
src/screens/             Splash, Login, Register, Home, Detalle, Carrito,
                         Pedidos, Favoritos, Perfil
src/components/          RestaurantCard, FormField, PrimaryButton
src/navigation/          AuthStack, AppNavigator (Tabs + Detalle/Carrito),
                         RootStackParamList, TabParamList
src/types/               Negocio, Producto, Pedido, EstadoPedido, Usuario
src/services/            api.ts, firebase.ts, storage.ts, location.ts
src/context/             AuthContext, CartContext, FavoritesContext
src/data/                negocios.json, productos.json (fuente única)
scripts/                 mock-server.js (API local), seed-firestore.js
firestore.rules          Reglas de seguridad (pegar en consola)
odd/tasks/               Seguimiento de avance por feature
```

## Origen de datos (triple origen)

`src/services/api.ts` resuelve cada lectura con el primer origen disponible:

1. **Firestore** — datos reales (`negocios`, `productos`).
2. **API local** — `npm run mock-api` → `GET http://localhost:3000/negocios`.
3. **Fallback en memoria** — JSON compilado; la demo nunca queda en blanco.

El catálogo vive en JSON como fuente única: la app, el mock-server y el
seed leen `src/data/*.json`.

## Puesta en marcha

```powershell
npm install
npm run mock-api      # terminal 1: API local
npx expo start -c     # terminal 2: app (Expo Go, misma WiFi)
```

### Firebase (APF3)

1. Crear proyecto, habilitar Auth Email/Password y Firestore (producción).
2. Registrar app web `</>` y copiar `.env.example` a `.env` con los valores.
3. Pegar `firestore.rules` en Firestore → Reglas → Publicar.
4. Descargar `service-account.json` (Cuentas de servicio) a la raíz
   (está en `.gitignore`, nunca se sube) y correr el seed:

```powershell
npm run seed   # 15 negocios + 48 productos
```

## Estado del proyecto

- **APF1** — idea, mockups, pantallas base, tipos del dominio.
- **APF2** (rama `APF2`, en GitHub) — Tabs + Detalle + Carrito, FlatList,
  consumo de API, formularios validados, AsyncStorage, GPS por cercanía.
- **APF3** (rama `feature/apf3-firebase-base`) — F1 Auth real con roles ✔,
  F2 Firestore + seed (15 negocios, 48 productos) ✔, F3 pedidos con
  tracking en tiempo real ✔, F4 panel negocio (estados + alta de menú) ✔,
  F5 notificaciones locales ✔ (activas en dev build/APK; en Expo Go son
  no-op desde SDK 53).

## Convenciones

- Ramas `feature/nombre`; nada directo a `master` sin revisión.
- Commits en español, estilo convencional (`feat`, `fix`, `docs`, `chore`).
- `npx tsc --noEmit` sin errores antes de cada commit.
- `.env` y `service-account.json` jamás se suben al repo.

## Equipo

- Lechuga Monge, Esaú Alexander – U23203849
- Lavado Yañez, Jose – U23203374

Docente: Cota Sencara, David William — Sección 32835 — 2026
