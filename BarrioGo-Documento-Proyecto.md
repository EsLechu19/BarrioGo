# BarrioGo — Documento técnico integral del proyecto

> **Rama analizada:** `feature/apf2-ui-unido`  
> **Propósito:** documentar el estado real del proyecto desde su entrada hasta sus módulos funcionales, diferenciando el alcance APF2 de funcionalidades posteriores incorporadas en la misma rama.  
> **Advertencia académica:** este documento describe el código existente; no convierte automáticamente una funcionalidad de diseño o mock en una funcionalidad productiva.

## 1. Resumen ejecutivo

BarrioGo es una aplicación móvil desarrollada con React Native y Expo para facilitar la consulta de negocios gastronómicos de barrio y la organización de pedidos directos. El cliente puede autenticarse, consultar negocios y productos, buscar y filtrar establecimientos, revisar detalles, marcar favoritos y administrar un carrito.

La solución utiliza TypeScript estricto, React Navigation, Context API, Hooks, `fetch`, una API mock local, archivos JSON, AsyncStorage y Expo Location. La rama también contiene una evolución posterior con Firebase Authentication, Firestore, pedidos en tiempo real, un panel para negocios, Cloudinary y notificaciones locales.

Para una sustentación de APF2 deben presentarse como núcleo principal: navegación, formularios, estados, catálogo, consumo de API, fallback local, detalle, carrito, favoritos, persistencia local y GPS. Los módulos posteriores deben identificarse como ampliaciones o avance adicional, no como criterios originales de APF2.

## 2. Problema que aborda

Los negocios gastronómicos pequeños suelen atender mediante canales dispersos. El cliente puede tener dificultades para consultar un menú actualizado, seleccionar cantidades, conservar sus preferencias y revisar el contenido de un pedido de manera ordenada.

BarrioGo centraliza este flujo en una aplicación móvil: muestra negocios, permite consultar sus productos, facilita la selección de artículos y conserva localmente información de uso frecuente. El proyecto no debe presentarse todavía como una plataforma comercial completa: pagos, logística, backend productivo, despliegue en tiendas y operación real requieren etapas adicionales.

## 3. Stack tecnológico

| Tecnología | Uso en el proyecto |
|---|---|
| React Native | Construcción de la interfaz móvil multiplataforma. |
| Expo SDK 57 | Runtime, herramientas de desarrollo y módulos nativos. |
| React | Componentes funcionales y Hooks. |
| TypeScript | Tipado estático con `strict: true`. |
| React Navigation | Stack Navigator y Bottom Tab Navigator. |
| Firebase Auth | Autenticación real incorporada en la evolución posterior. |
| Firestore | Negocios, productos, pedidos y datos de usuario en la evolución posterior. |
| Fetch API | Consulta de la API mock local. |
| AsyncStorage | Persistencia local de carrito y favoritos. |
| Expo Location | Permisos, ubicación y ordenamiento por cercanía. |
| Cloudinary | Carga de imágenes del negocio en la evolución posterior. |
| Node.js HTTP | Servidor mock local sin dependencias adicionales. |
| Git/GitHub | Control de versiones y ramas de trabajo. |

## 4. Inicio de la aplicación

### 4.1. Entrada

`index.ts` registra el componente raíz mediante `registerRootComponent(App)`. El campo `main` de `package.json` apunta a este archivo.

### 4.2. Componente raíz

`App.tsx` configura el árbol principal:

```text
SafeAreaProvider
└── AuthProvider
    └── CartProvider
        └── FavoritesProvider
            └── NavigationContainer
                ├── AuthNavigator si no existe usuario
                └── AppNavigator si existe usuario
```

El componente raíz también espera la hidratación de autenticación antes de elegir el navegador correspondiente. El flujo real de autenticación actual utiliza Firebase Auth; los métodos de sesión de AsyncStorage permanecen en el servicio, pero no son la fuente principal del estado de usuario.

## 5. Configuración del proyecto

### 5.1. `package.json`

Scripts disponibles:

```powershell
npm start
npm run android
npm run ios
npm run web
npm run mock-api
npm run seed
```

No existe un script `test`, `lint` o `typecheck` dedicado. La verificación de TypeScript se ejecuta directamente con:

```powershell
npx tsc --noEmit
```

### 5.2. `tsconfig.json`

El proyecto trabaja con TypeScript estricto. Esto obliga a declarar tipos de estados, propiedades, respuestas y parámetros, y reduce errores de uso de datos provenientes de API o almacenamiento local.

### 5.3. `app.json`

Define la configuración Expo, orientación vertical, iconos, splash screen y permiso de ubicación para iOS. La validación de permisos Android debe confirmarse en el build nativo correspondiente.

### 5.4. Variables de entorno

`.env.example` documenta variables para Firebase y Cloudinary. Los archivos `.env*` deben permanecer fuera del control de versiones. No se deben incluir claves privadas ni cuentas de servicio en una entrega académica.

### 5.5. Reglas backend

`firestore.rules` y `storage.rules` contienen reglas para la evolución Firebase/Storage. Estas reglas corresponden a la integración posterior y deben revisarse antes de considerar el sistema listo para producción.

## 6. Estructura completa del código fuente

```text
src/
├── components/
│   ├── CantidadStepper.tsx
│   ├── EmptyState.tsx
│   ├── FormField.tsx
│   ├── InfoBanner.tsx
│   ├── OpinionCard.tsx
│   ├── PrimaryButton.tsx
│   ├── RestaurantCard.tsx
│   ├── ScreenHeader.tsx
│   ├── SeccionCard.tsx
│   ├── SelectableCard.tsx
│   ├── SettingRow.tsx
│   ├── StateView.tsx
│   ├── UbicacionInput.tsx
│   ├── detalle/InfoTab.tsx
│   ├── detalle/ProductoCard.tsx
│   ├── detalle/ReviewsTab.tsx
│   ├── detalle/TabBar.tsx
│   ├── negocio/CircleTabBar.tsx
│   ├── negocio/Ganancias.tsx
│   ├── negocio/Locales.tsx
│   ├── negocio/Menu.tsx
│   ├── negocio/Pedidos.tsx
│   ├── negocio/Perfil.tsx
│   └── negocio/Repartidores.tsx
├── context/
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── FavoritesContext.tsx
├── data/
│   ├── negocios.json
│   ├── negociosMock.ts
│   ├── productos.json
│   └── productosMock.ts
├── hooks/
│   ├── useFotoNegocio.ts
│   ├── useNegocioId.ts
│   └── useUbicacionGps.ts
├── navigation/
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── AuthStackParamList.ts
│   ├── RootStackParamList.ts
│   ├── TabNavigator.tsx
│   ├── TabParamList.ts
│   └── TabScreenProps.ts
├── screens/
│   ├── SplashScreen.tsx
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── HomeScreen.tsx
│   ├── RestaurantsScreen.tsx
│   ├── DetalleScreen.tsx
│   ├── CarritoScreen.tsx
│   ├── PedidosScreen.tsx
│   ├── PedidoDetalleScreen.tsx
│   ├── FavoritosScreen.tsx
│   ├── PerfilScreen.tsx
│   ├── MisDatosScreen.tsx
│   ├── DireccionesScreen.tsx
│   ├── MetodosPagoScreen.tsx
│   ├── AyudaScreen.tsx
│   ├── ConfiguracionScreen.tsx
│   ├── NotificacionesScreen.tsx
│   ├── RegistrarNegocioScreen.tsx
│   ├── MiLocalScreen.tsx
│   └── NegocioScreen.tsx
├── services/
│   ├── api.ts
│   ├── firebase.ts
│   ├── location.ts
│   ├── notificaciones.ts
│   └── storage.ts
├── styles/colors.ts
├── types/
│   ├── Establecimiento.ts
│   ├── Negocio.ts
│   ├── Opinion.ts
│   ├── Pedido.ts
│   ├── Producto.ts
│   ├── Repartidor.ts
│   └── Usuario.ts
└── utils/
    ├── confirm.ts
    ├── estadosPedido.ts
    ├── fechas.ts
    ├── negocios.ts
    └── usuario.ts
```

## 7. Navegación completa

### 7.1. Navegador de autenticación

`AuthNavigator.tsx` contiene:

- `Splash`: pantalla inicial mientras se determina la sesión.
- `Login`: formulario de inicio de sesión.
- `Register`: formulario de registro.

### 7.2. Navegador principal

`AppNavigator.tsx` registra:

- `Tabs`.
- `Detalle`.
- `Restaurants`.
- `Carrito`.
- `PedidoDetalle`.
- `Notificaciones`.
- `RegistrarNegocio`.
- `MiLocal`.
- `MisDatos`.
- `Direcciones`.
- `MetodosPago`.
- `Ayuda`.
- `Configuracion`.

### 7.3. Pestañas

`TabNavigator.tsx` contiene:

- `InicioTab` → `HomeScreen`.
- `PedidosTab` → `PedidosScreen`.
- `FavoritosTab` → `FavoritosScreen`.
- `PerfilTab` → `PerfilScreen`.
- `NegocioTab` → `NegocioScreen`, visible únicamente si el usuario tiene rol `negocio`.

La navegación utiliza Stack y Tabs. No se utiliza Drawer.

## 8. Contextos globales

### 8.1. `AuthContext`

Responsabilidades:

- Escuchar el estado de Firebase Auth.
- Registrar usuarios con correo y contraseña.
- Iniciar y cerrar sesión.
- Leer el rol del usuario desde `users/{uid}`.
- Mantener los roles `cliente` y `negocio`.
- Exponer `refreshRol()` después del registro de un negocio.

### 8.2. `CartContext`

Responsabilidades:

- Agregar productos.
- Incrementar y disminuir cantidades.
- Eliminar productos al llegar a cero.
- Calcular cantidad total.
- Calcular monto total.
- Guardar y recuperar el carrito mediante `storage.ts`.

### 8.3. `FavoritesContext`

Responsabilidades:

- Marcar y desmarcar negocios.
- Consultar si un negocio es favorito.
- Persistir identificadores de negocios en AsyncStorage.

El comentario inicial del archivo menciona memoria para APF2, pero la implementación actual sí carga y guarda favoritos mediante `storage.loadFavorites()` y `storage.saveFavorites()`.

## 9. Hooks personalizados

### `useUbicacionGps.ts`

Controla la solicitud y lectura de la ubicación, el estado de carga, los avisos y la ejecución de la actualización GPS.

### `useNegocioId.ts`

Obtiene el identificador del negocio asociado al usuario autenticado desde `users/{uid}.negocioId`.

### `useFotoNegocio.ts`

Administra permisos de galería y cámara, selección de imágenes y carga a Cloudinary. Forma parte de la evolución de gestión de negocios.

## 10. Servicios

### 10.1. `src/services/api.ts`

Centraliza el acceso a datos y evita que las pantallas implementen directamente el consumo de API.

Cadena de orígenes para negocios:

```text
1. Firestore, si Firebase está disponible y devuelve datos válidos.
2. API local: http://localhost:3000/negocios.
3. Fallback local: negociosMock.
```

Funciones principales:

- `getNegocios()`.
- `getNegociosConOrigen()`.
- `getNegocioById()`.
- `getMenu()`.
- `crearPedido()`.
- `escucharMisPedidos()`.
- `escucharPedidosNegocio()`.
- `cambiarEstadoPedido()`.
- `crearProducto()`.
- `registrarNegocio()`.
- `actualizarNegocio()`.
- `subirFotoNegocio()`.

El servicio valida respuestas desconocidas antes de convertirlas en `Negocio[]`, `Producto[]` o pedidos.

### 10.2. API mock local

`scripts/mock-server.js` utiliza el módulo HTTP de Node y expone:

- `GET /health`.
- `GET /negocios`.

La respuesta de negocios incorpora un retraso artificial aproximado de 800 ms para permitir observar el estado de carga. Los datos provienen de `src/data/negocios.json`.

### 10.3. `src/services/storage.ts`

Claves de almacenamiento:

- `barriogo:cart:v1`.
- `barriogo:favorites:v1`.
- `barriogo:session:v1`.

El carrito y favoritos se validan con type guards antes de utilizar el JSON recuperado. La clave de sesión existe en el servicio, pero el flujo actual utiliza Firebase Auth como fuente principal.

### 10.4. `src/services/location.ts`

Responsabilidades:

- Solicitar permiso de ubicación en primer plano.
- Usar la última posición conocida cuando existe.
- Solicitar posición actual con timeout aproximado de ocho segundos.
- Calcular distancia mediante Haversine.
- Formatear distancias en metros o kilómetros.

### 10.5. `src/services/firebase.ts`

Inicializa Firebase cuando las variables de entorno requeridas están disponibles y expone el estado `firebaseReady`, Auth y Firestore. Cuando no existe configuración, las funciones que requieren Firebase no deben presentarse como operativas.

### 10.6. `src/services/notificaciones.ts`

Contiene la evolución de notificaciones locales asociadas a cambios de estado de pedidos. No debe confundirse con un sistema completo de notificaciones push remoto.

## 11. Pantallas del cliente

### 11.1. `SplashScreen`

Presenta la identidad visual inicial mientras se determina el estado de autenticación.

### 11.2. `LoginScreen`

Incluye campos de correo y contraseña, validación de entradas, manejo de errores y acciones para iniciar sesión o navegar al registro.

### 11.3. `RegisterScreen`

Incluye registro mediante correo y contraseña, validación de formato, confirmación de contraseña y mensajes de error.

### 11.4. `HomeScreen`

Es la pantalla principal del cliente. Implementa:

- Consulta de negocios.
- Carga mediante `FlatList`.
- Búsqueda por nombre.
- Estado de carga.
- Estado de error.
- Estado sin resultados.
- Actualización mediante refresh.
- Aviso del origen de datos.
- Ordenamiento por cercanía cuando hay GPS.
- Acceso al detalle.

### 11.5. `RestaurantsScreen`

Presenta el catálogo completo con búsqueda y filtros por envío, calificación y categoría. También utiliza el ordenamiento por ubicación cuando existe una coordenada válida.

### 11.6. `DetalleScreen`

Incluye:

- Portada y datos del negocio.
- Favorito.
- Menú.
- Cantidades por producto.
- Información.
- Opiniones.
- Promedio y distribución de estrellas.
- Formulario visual para opinión.

Las opiniones actuales son mock y se mantienen en memoria. No existe persistencia de opiniones.

### 11.7. `CarritoScreen`

Incluye:

- Lista de productos.
- Modificación de cantidades.
- Eliminación al reducir a cero.
- Cálculo del total.
- Validación de productos pertenecientes a un único negocio.
- Confirmación del pedido.

La confirmación actual llama a `crearPedido()` y requiere Firebase configurado. Por tanto, el carrito es demostrable localmente, pero el registro productivo del pedido pertenece a la integración posterior.

### 11.8. `FavoritosScreen`

Muestra negocios marcados como favoritos y permite retirarlos. Los identificadores se conservan en AsyncStorage.

### 11.9. `PedidosScreen`

Escucha pedidos del usuario en Firestore y muestra su estado. Sin Firebase configurado, presenta un aviso de configuración. Esta pantalla corresponde principalmente a la evolución posterior.

### 11.10. `PedidoDetalleScreen`

Presenta el detalle y una línea temporal de estados:

```text
pendiente → confirmado → en_camino → entregado
```

### 11.11. `PerfilScreen`

Muestra información del usuario, rol, accesos a configuración y acción de cierre de sesión.

### 11.12. `MisDatosScreen`

Presenta datos del usuario. La edición no está integrada como persistencia completa.

### 11.13. `DireccionesScreen`

Presenta dos direcciones mock: Casa y Trabajo. Permite seleccionar una opción localmente; no guarda direcciones en Firestore ni altera de forma completa el checkout.

### 11.14. `MetodosPagoScreen`

Presenta métodos mock: efectivo, Yape y Visa. No existe pasarela, tokenización ni integración con el proceso de pago.

### 11.15. `AyudaScreen`

Contiene preguntas frecuentes estáticas.

### 11.16. `ConfiguracionScreen`

Contiene opciones visuales y toggles en memoria. No todas las preferencias se persisten.

### 11.17. `NotificacionesScreen`

Presenta una lista estática o local de notificaciones. No representa por sí sola un backend de notificaciones históricas.

## 12. Módulos para negocios

### `RegistrarNegocioScreen`

Permite registrar un negocio en Firestore, asociarlo al usuario y cambiar el rol a `negocio`. Utiliza ubicación inicial de Lima cuando no existe una posición obtenida.

### `MiLocalScreen`

Permite editar información del negocio, ubicación, envío gratis e imágenes. Utiliza `useFotoNegocio` y Cloudinary para la evolución posterior.

### `NegocioScreen`

Funciona como panel del negocio. Integra componentes para:

- Pedidos.
- Menú.
- Perfil.
- Ganancias.
- Repartidores.
- Locales.

La disponibilidad real de cada operación depende de Firestore, reglas y datos configurados.

## 13. Componentes reutilizables

| Componente | Responsabilidad |
|---|---|
| `CantidadStepper` | Aumentar o disminuir cantidades. |
| `EmptyState` | Mostrar ausencia de datos. |
| `FormField` | Campo de formulario con etiquetas y errores. |
| `InfoBanner` | Avisos informativos. |
| `OpinionCard` | Renderizar una opinión. |
| `PrimaryButton` | Acción principal reutilizable. |
| `RestaurantCard` | Tarjeta de negocio. |
| `ScreenHeader` | Encabezado y navegación de retorno. |
| `SeccionCard` | Agrupar secciones de configuración. |
| `SelectableCard` | Selección visual de direcciones o métodos. |
| `SettingRow` | Fila de configuración. |
| `StateView` | Estados de carga, error o contenido. |
| `UbicacionInput` | Entrada relacionada con ubicación. |
| `ProductoCard` | Producto dentro del detalle. |
| `InfoTab` | Información del negocio. |
| `ReviewsTab` | Opiniones del negocio. |
| `TabBar` | Pestañas del detalle. |
| `CircleTabBar` | Navegación circular del panel negocio. |
| `Ganancias` | Vista de ganancias del negocio. |
| `Locales` | Vista de locales. |
| `Menu` | Gestión visual del menú. |
| `Pedidos` | Gestión visual de pedidos. |
| `Perfil` | Perfil del negocio. |
| `Repartidores` | Vista de repartidores. |

## 14. Modelos y tipos de dominio

Los tipos principales viven en `src/types`:

- `Negocio.ts`: identidad, categoría, ubicación, calificación, delivery y datos comerciales.
- `Producto.ts`: producto, precio, descripción, categoría y relación con negocio.
- `Pedido.ts`: pedido, productos, usuario, negocio, total y estado.
- `Usuario.ts`: datos de usuario y rol.
- `Opinion.ts`: opinión, estrellas, texto y fecha.
- `Repartidor.ts`: información del repartidor.
- `Establecimiento.ts`: datos complementarios del establecimiento.

`Opinion.ts` restringe estrellas al rango `1 | 2 | 3 | 4 | 5` y limita el texto de opinión a 280 caracteres mediante `MAX_TEXTO_OPINION`.

## 15. Datos y flujo completo

### 15.1. Flujo del catálogo

```text
HomeScreen / RestaurantsScreen
        ↓
getNegociosConOrigen()
        ↓
Firestore, si está listo
        ↓ si no responde
API mock local
        ↓ si no responde
negociosMock / negocios.json
        ↓
validación de estructura
        ↓
renderizado mediante RestaurantCard y FlatList
```

### 15.2. Flujo del detalle

```text
seleccionar negocio
        ↓
DetalleScreen con negocioId
        ↓
getNegocioById() + getMenu()
        ↓
renderizar datos y productos
        ↓
agregar producto al CartContext
```

### 15.3. Flujo del carrito

```text
ProductoCard
        ↓
CartContext.add()
        ↓
AsyncStorage
        ↓
CarritoScreen
        ↓
cantidad, validación y total
        ↓
crearPedido() si Firebase está configurado
```

### 15.4. Flujo GPS

```text
solicitar permiso
        ↓
obtener ubicación
        ↓
calcular distancia Haversine
        ↓
ordenar negocios por cercanía
        ↓
si falla: conservar orden original y mostrar aviso
```

## 16. GPS, permisos y limitaciones

El proyecto solicita ubicación en primer plano y no debe bloquear el catálogo si el usuario rechaza el permiso. No existe un mapa real integrado: `InfoTab.tsx` utiliza un placeholder y deja `react-native-maps` como trabajo futuro.

La cámara existe como soporte para imágenes de negocio mediante `useFotoNegocio`, pero no es una capacidad principal del flujo APF2 del cliente. El acelerómetro no se encuentra implementado.

## 17. Diseño visual y assets

`src/styles/colors.ts` centraliza la paleta, incluyendo naranja primario aproximado `#f97316`, fondos claros, colores de éxito y error, colores de proveedores y tonos para tarjetas y banners.

Assets principales:

```text
assets/
├── icon.png
├── splash-icon.png
├── favicon.png
├── android-icon-background.png
├── android-icon-foreground.png
├── android-icon-monochrome.png
└── img/
    ├── fondo.jpg
    ├── logoLlama.png
    ├── Llamadefrente.png
    ├── llamaregister.png
    └── llamacarrito.png
```

Las tarjetas de negocios utilizan principalmente URLs remotas provenientes de los datos. Los productos no tienen un catálogo completo de imágenes locales.

## 18. Pruebas y verificación actual

No se encontraron archivos automatizados con patrones `*.test.ts`, `*.test.tsx`, `*.spec.ts` o `*.spec.tsx`. Tampoco existe un script dedicado de pruebas.

La comprobación disponible es:

```powershell
npx tsc --noEmit
```

Para documentar la entrega deben añadirse evidencias reales de:

- Login y Register.
- Catálogo.
- Búsqueda y filtros.
- Detalle.
- Carrito.
- Favoritos.
- Recuperación de AsyncStorage.
- GPS aceptado y rechazado.
- API mock y fallback.
- Firebase, únicamente si se presenta como ampliación posterior y existe configuración válida.

## 19. Clasificación para la presentación de mañana

### Núcleo APF2 que sí conviene presentar

- Aplicación móvil en React Native y Expo.
- TypeScript.
- Stack Navigator y Bottom Tabs.
- Formularios validados.
- Catálogo con `FlatList`.
- Búsqueda y filtros.
- API mock mediante `fetch`.
- Fallback con JSON local.
- Pantalla de detalle.
- Carrito y cálculo de total.
- Favoritos.
- AsyncStorage.
- GPS, permisos y cercanía.
- Componentes reutilizables.
- Estados de carga, error y vacío.

### Funcionalidad posterior que existe en la rama, pero debe etiquetarse como ampliación

- Firebase Authentication.
- Firestore.
- Pedidos en tiempo real.
- Estados de pedido.
- Panel de negocio.
- Registro y edición de negocio.
- Cloudinary.
- Notificaciones locales.

### Funcionalidad visual o mock que no debe venderse como backend real

- Métodos de pago.
- Direcciones persistentes.
- Opiniones persistentes.
- Notificaciones históricas.
- Repartidores reales.
- Ganancias reales.
- Locales adicionales persistentes.
- Mapa funcional.

## 20. Inconsistencias que deben corregirse o explicarse

1. La rama APF2 incluye código posterior de Firebase y panel de negocio. En la exposición se debe separar por fases.
2. `FavoritesContext.tsx` contiene un comentario antiguo que dice que los favoritos están solo en memoria, aunque actualmente usa AsyncStorage.
3. `storage.ts` tiene funciones de sesión local, pero `AuthContext.tsx` utiliza Firebase Auth.
4. La confirmación del pedido requiere Firebase; el carrito local no equivale a persistencia productiva de pedidos.
5. Pagos y direcciones son pantallas visuales y no están integrados de manera completa al checkout.
6. Las opiniones se almacenan en memoria y se pierden al desmontar la pantalla.
7. `PedidosScreen` depende de Firestore y no tiene fallback local equivalente al catálogo.
8. `service-account.json` debe permanecer ignorado y nunca incluirse en la entrega.
9. No se deben afirmar pruebas automatizadas porque no se encontraron archivos de test.
10. No se deben afirmar APK generado, publicación en Expo.dev o métricas de rendimiento si no existe evidencia verificable.

## 21. Comandos de ejecución

```powershell
npm install
npm run mock-api
npx expo start -c
```

Verificación de tipos:

```powershell
npx tsc --noEmit
```

Para usar Firebase se requieren las variables de entorno y la configuración correspondiente. Para usar el servidor mock, el dispositivo y la computadora deben poder alcanzar la URL configurada; en un dispositivo físico, `localhost` puede referirse al propio teléfono y requerir una configuración de red diferente.

## 22. Conclusión técnica

La rama `feature/apf2-ui-unido` contiene un prototipo amplio: su núcleo APF2 demuestra la construcción de una aplicación móvil con navegación, estados, consumo de datos, persistencia local y geolocalización. Además, conserva una evolución posterior orientada a backend, pedidos y gestión de negocios.

La forma profesional de presentar el proyecto es explicar primero el núcleo APF2, mostrar sus evidencias y, al final, declarar las extensiones posteriores como trabajo adicional. Esto evita confundir funcionalidades mock, módulos incompletos y capacidades que dependen de servicios externos con resultados ya validados.
