# BarrioGo — Avance de Proyecto Final 02

Aplicación móvil multiplataforma para pedidos directos entre negocios
gastronómicos de barrio y sus clientes recurrentes. Esta rama (`feature/apf2-ui-unido`)
combina la lógica funcional de APF2 con el sistema visual y la experiencia de
usuario de `feature/ui-consistencia`.

## Resultado del avance

BarrioGo cumple los objetivos principales de APF2:

- Navegación tipada con Stack y Bottom Tabs.
- Catálogo dinámico de negocios y productos mediante API local y JSON.
- `FlatList`, estados de carga, estados vacíos y manejo de errores.
- Login y registro con validaciones de formularios.
- Detalle de negocio, favoritos y carrito de compras.
- Persistencia local con AsyncStorage.
- Ordenamiento de negocios por cercanía usando GPS, con fallback seguro.
- Interfaz consistente con componentes reutilizables y diseño responsive.

## Propuesta de valor

Las plataformas de delivery masivas cobran 25%–35% por pedido, incluso a
clientes que el negocio ya tenía. BarrioGo es un canal directo con
suscripción fija o comisión reducida (8%–12%): el negocio gestiona su
catálogo y sus pedidos; el cliente pide y sigue su pedido en tiempo real.

> No competimos por captar clientes nuevos; optimizamos y rentabilizamos
> la relación con los clientes que el negocio ya tenía.

## Stack y dependencias principales

- React Native + Expo (SDK 57) + TypeScript estricto
- React Navigation (Stack + Bottom Tabs, sin Expo Router)
- Firebase (Auth + Firestore) como backend
- AsyncStorage para persistencia local
- Expo Location / Image Picker / Notifications para hardware

Las dependencias se encuentran declaradas en `package.json` y se instalan con
`npm install`. Para agregar una dependencia compatible con Expo se recomienda
usar `npx expo install <paquete>`.

## Estructura

```
App.tsx                  Raíz: providers + navegación condicional por sesión
src/screens/             Splash, Login, Register, Home, Detalle, Carrito,
                         Pedidos, Favoritos, Perfil y pantallas auxiliares
src/components/          Componentes visuales reutilizables y componentes
                         específicos de detalle y negocio
src/hooks/               Hooks reutilizables para GPS, fotos y negocio
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

## Consumo de datos

`src/services/api.ts` resuelve cada lectura con el primer origen disponible:

1. **Firestore** — datos reales, cuando Firebase está configurado.
2. **API local** — `npm run mock-api` → `GET http://localhost:3000/negocios`.
3. **Fallback local** — JSON compilado; la demo no queda en blanco sin red.

El catálogo vive en JSON como fuente única: la app, el mock-server y el
seed leen `src/data/*.json`.

## Puesta en marcha rápida

```powershell
npm install
npm run mock-api      # terminal 1: API local
npx expo start -c     # terminal 2: app en Expo Go
```

Para abrir la app en un teléfono físico, el teléfono y la computadora deben
estar en la misma red Wi-Fi. También se puede usar un emulador Android.

## Guion de demostración APF2

1. Abrir la app y mostrar el Splash y el Login.
2. Intentar enviar Login/Registro con campos vacíos para mostrar validaciones.
3. Ingresar al Home y mostrar la carga del catálogo en un `FlatList`.
4. Buscar o seleccionar un negocio y abrir su detalle.
5. Agregar productos, cambiar cantidades y abrir el carrito.
6. Confirmar el pedido y mostrar la navegación hacia Pedidos.
7. Marcar productos como favoritos y comprobar su persistencia.
8. Cerrar y abrir la app para comprobar la sesión y el carrito persistido.
9. Mostrar la ubicación, el orden por cercanía y el fallback cuando el permiso
   de GPS es rechazado.

## Verificación antes de presentar

```powershell
npx tsc --noEmit
```

El comando debe terminar sin errores. Antes de presentar también conviene
comprobar que la rama no contiene archivos sensibles:

```powershell
git status --short
git ls-files .env service-account.json
```

Los dos últimos archivos deben estar ignorados y no deben aparecer como
archivos versionados.

## Configuración opcional de Firebase (APF3)

1. Crear proyecto, habilitar Auth Email/Password y Firestore (producción).
2. Registrar app web `</>` y copiar `.env.example` a `.env` con los valores.
3. Pegar `firestore.rules` en Firestore → Reglas → Publicar.
4. Descargar `service-account.json` (Cuentas de servicio) a la raíz
   (está en `.gitignore`, nunca se sube) y correr el seed:

```powershell
npm run seed   # 15 negocios + 48 productos
```

## Estado del proyecto y alcance de la presentación

- **APF1** — idea, mockups, pantallas base, tipos del dominio.
- **APF2** (esta rama `feature/apf2-ui-unido`) — Tabs + Detalle + Carrito,
  `FlatList`, consumo de API/mock, formularios validados, AsyncStorage, GPS
  por cercanía y sistema visual consistente.
- **APF3** (rama `feature/apf3-firebase-base`) — F1 Auth real con roles ✔,
  F2 Firestore + seed (15 negocios, 48 productos) ✔, F3 pedidos con
  tracking en tiempo real ✔, F4 panel negocio (estados + alta de menú) ✔,
  F5 notificaciones locales ✔ (activas en dev build/APK; en Expo Go son
  no-op desde SDK 53).
- **F6** (misma rama) — cada cuenta registra su propio negocio ✔ (S1), edita
  su local ✔ (S2), icono + portada por Cloudinary Free ✔ (S3, verificado en
  físico), reglas solo-dueño ✔ (S4, campo `duenioId` sin eñe).

APF3 y F6 son avances posteriores y no reemplazan los criterios funcionales
de APF2. Para esta presentación se debe priorizar el guion APF2 anterior.

## Convenciones

- Ramas `feature/nombre`; nada directo a `master` sin revisión.
- Commits en español, estilo convencional (`feat`, `fix`, `docs`, `chore`).
- `npx tsc --noEmit` sin errores antes de cada commit.
- `.env` y `service-account.json` jamás se suben al repo.

## Equipo

- Lechuga Monge, Esaú Alexander – U23203849
- Lavado Yañez, Jose – U23203374

Docente: Cota Sencara, David William — Sección 32835 — 2026
