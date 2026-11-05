# 🍽️ BarrioGo

### Pedidos directos para negocios gastronómicos de barrio

**BarrioGo** es una aplicación móvil multiplataforma que conecta a negocios gastronómicos locales con sus clientes. Permite explorar establecimientos y sus menús, organizar un carrito, realizar pedidos y consultar su estado; también incluye herramientas para que cada negocio administre su catálogo y su operación.

El proyecto se desarrolla con **React Native, Expo, TypeScript y Firebase**, con una arquitectura de componentes y servicios que separa la interfaz, el estado de la aplicación y el acceso a los datos.

> **Estado:** proyecto académico en evolución. Incluye flujos funcionales y recursos de demostración; no se presenta como un servicio comercial desplegado.

**Stack principal:** React Native · Expo SDK 57 · TypeScript · Firebase Authentication · Firestore · AsyncStorage

---

## 🎯 Problema y propuesta de valor

Los pequeños negocios gastronómicos suelen depender de canales externos o de una gestión manual para recibir y organizar pedidos. BarrioGo explora una alternativa de **contacto directo entre el establecimiento y sus clientes**, con catálogo digital y seguimiento del pedido en una misma aplicación.

La propuesta busca facilitar la experiencia de compra y ofrecer al negocio herramientas para gestionar pedidos y productos. **Los modelos de suscripción o comisión son ideas de negocio en evaluación, no funciones de cobro implementadas en esta versión.**

---

## 📱 Demostración

La aplicación incluye flujos de inicio de sesión, exploración de negocios, detalle de productos, carrito, seguimiento de pedidos y gestión de establecimientos.

> **Capturas pendientes de incorporar:** inicio, detalle de negocio, carrito/seguimiento y panel del propietario. Para mostrar la interfaz real, añade imágenes del proyecto en una carpeta `docs/screenshots/` y enlázalas aquí.

---

## ✨ Funcionalidades

### 👤 Experiencia del cliente

- Registro e inicio de sesión mediante Firebase Authentication cuando el servicio está configurado.
- Exploración de negocios y catálogos de productos.
- Consulta del detalle de cada establecimiento y su menú.
- Ordenamiento por cercanía mediante ubicación, con manejo de permisos y alternativas cuando el GPS no está disponible.
- Gestión de favoritos y carrito de compras.
- Confirmación de pedidos y consulta de su historial y estado.
- Seguimiento de cambios de estado mediante suscripciones a Firestore.
- Persistencia local de preferencias y otros datos de la experiencia móvil con AsyncStorage.
- Direcciones y métodos de pago como parte del flujo de usuario; **esto no implica procesamiento de pagos en línea**.

### 🏪 Experiencia del negocio

- Registro de un establecimiento vinculado a la cuenta del propietario.
- Consulta y edición de información del local.
- Gestión de productos del menú.
- Visualización de pedidos recibidos y actualización de sus estados.
- Indicadores de pedidos y ventas calculados a partir de los registros disponibles.
- Personalización con imágenes del negocio mediante la integración configurada para carga de fotos.

> Algunas funciones requieren Firebase configurado y reglas de seguridad publicadas. La ejecución con catálogos de demostración no equivale a un flujo real de pedidos persistidos.

---

## 🏗️ Arquitectura y flujo de datos

BarrioGo utiliza una aplicación React Native con navegación tipada mediante **React Navigation (Stack y Bottom Tabs)**. El estado de autenticación, carrito y favoritos se organiza en contextos; las operaciones de datos se concentran principalmente en `src/services/api.ts`.

```text
                 BARRIOGO (React Native + Expo)
                              |
             +----------------+----------------+
             |                |                |
         Pantallas        Contextos        Navegación
             |                |                |
             +----------------+----------------+
                              |
                       Capa de servicios
                              |
              +---------------+---------------+
              |                               |
       Firebase configurado             Entorno de demo
              |                               |
      Auth + Firestore                 API local / JSON
              |
       Pedidos y catálogo
              |
      Actualización en vivo

       AsyncStorage: persistencia local de datos
```

### Decisiones técnicas destacadas

**Acceso a datos centralizado.** Las pantallas consumen funciones de la capa de servicios, evitando dispersar consultas a Firestore por toda la interfaz.

**Tres fuentes para el catálogo.** Cuando corresponde, el catálogo se obtiene de Firestore; si no está disponible, puede recurrir a una API local y finalmente a datos de demostración incluidos en el proyecto. Este mecanismo permite explorar la interfaz sin depender siempre de una conexión remota. **No debe confundirse con un backend de pedidos offline.**

**Pedidos en tiempo real.** Los pedidos se almacenan en Firestore y las pantallas interesadas pueden suscribirse a cambios con `onSnapshot`, de modo que el cliente visualice las actualizaciones del negocio.

**Roles y reglas de acceso.** Firebase Authentication identifica a los usuarios; las reglas de Firestore contemplan accesos diferenciados entre clientes y propietarios, incluidos permisos sobre productos y cambios de estado de pedidos.

**Notificaciones locales.** La aplicación contempla avisos locales sobre cambios de estado. No utiliza un servicio propio de notificaciones push remotas para este flujo. Su comportamiento nativo requiere una compilación compatible; en Expo Go no se ejecutan esas notificaciones.

---

## 🛠️ Tecnologías

| Área | Herramientas |
|---|---|
| Aplicación móvil | React Native, Expo SDK 57, TypeScript |
| Navegación | React Navigation, Native Stack, Bottom Tabs |
| Autenticación | Firebase Authentication |
| Datos y tiempo real | Cloud Firestore, suscripciones `onSnapshot` |
| Persistencia local | AsyncStorage |
| Ubicación | Expo Location |
| Imágenes | Expo Image Picker e integración de carga de imágenes |
| Notificaciones | Expo Notifications (avisos locales) |
| Desarrollo | Git, GitHub, TypeScript, ODD |

---

## 📂 Organización del repositorio

```text
BarrioGo/
├── App.tsx                 # Providers y navegación principal
├── src/
│   ├── screens/            # Pantallas de clientes y negocios
│   ├── components/         # Componentes reutilizables
│   ├── navigation/         # Stack, tabs y tipos de rutas
│   ├── context/            # Auth, carrito, favoritos y tema
│   ├── services/           # API, Firebase, ubicación, almacenamiento
│   ├── hooks/              # Lógica reutilizable
│   ├── types/              # Modelos del dominio
│   ├── data/               # Datos para demostraciones
│   └── utils/              # Utilidades
├── scripts/
│   ├── mock-server.js      # API de desarrollo
│   └── seed-firestore.js   # Carga de datos de ejemplo
├── odd/tasks/              # Especificaciones y tareas de desarrollo
├── firestore.rules         # Reglas de acceso de Firestore
├── storage.rules           # Reglas de Storage del proyecto
├── .env.example
└── package.json
```

---

## 🚀 Instalación y ejecución

### Requisitos

- Node.js y npm compatibles con el proyecto.
- Expo Go o un emulador para explorar las funciones compatibles.
- Un proyecto Firebase configurado para probar autenticación y pedidos reales.
- Un dispositivo o una compilación de desarrollo para validar funciones nativas específicas.

### 1. Clonar e instalar

```bash
git clone https://github.com/EsLechu19/BarrioGo.git
cd BarrioGo
npm install
```

### 2. Ejecutar con el catálogo de demostración

En una terminal:

```bash
npm run mock-api
```

En otra terminal:

```bash
npx expo start -c
```

La aplicación dispone de datos locales para mostrar el catálogo si las fuentes remotas no están disponibles. En un teléfono físico, `localhost` hace referencia al propio teléfono: la API de desarrollo debe ser accesible desde el dispositivo o se utilizará el fallback disponible.

### 3. Configurar Firebase

Copiar `.env.example` a `.env` y completar las variables correspondientes:

```dotenv
EXPO_PUBLIC_FB_API_KEY=
EXPO_PUBLIC_FB_AUTH_DOMAIN=
EXPO_PUBLIC_FB_PROJECT_ID=
EXPO_PUBLIC_FB_STORAGE_BUCKET=
EXPO_PUBLIC_FB_SENDER_ID=
EXPO_PUBLIC_FB_APP_ID=
```

Luego:

1. Habilitar el método de inicio de sesión por correo y contraseña en Firebase Authentication.
2. Crear la base de Cloud Firestore.
3. Revisar y publicar las reglas incluidas en `firestore.rules` para el entorno de prueba.
4. Si se necesitan datos iniciales, utilizar el script `npm run seed` con una cuenta de servicio autorizada y configurada localmente.

**Seguridad:** no subir a GitHub el archivo `.env` ni credenciales de cuenta de servicio. Las variables públicas de Firebase no sustituyen las reglas de seguridad de Firestore.

---

## ✅ Verificación técnica

El proyecto utiliza TypeScript para validar los tipos de las pantallas, los modelos y las operaciones entre componentes.

```bash
npx tsc --noEmit
```

Además de la compilación de tipos, se recomienda comprobar manualmente estos recorridos:

- Registro e inicio de sesión con Firebase configurado.
- Catálogo, búsqueda o navegación, detalle de negocio y carrito.
- Confirmación del pedido y aparición en el historial del cliente.
- Cambio de estado desde la vista del negocio y actualización en el cliente.
- Ubicación con permiso concedido y denegado.
- Aislamiento de datos según las reglas de Firestore.

> No se publica una cifra de pruebas automatizadas porque el repositorio no documenta una suite de pruebas equivalente a la de otros proyectos. La verificación manual y el chequeo de tipos son evidencias distintas.

---

## 🧩 Proceso de desarrollo

BarrioGo se desarrolla como proyecto académico colaborativo y utiliza especificaciones y tareas organizadas en [`odd/tasks/`](odd/tasks/).

El trabajo contempla análisis de requisitos, definición de funcionalidades, implementación por etapas, revisión de comportamiento y validación técnica. Las herramientas de desarrollo asistido por IA se utilizan como apoyo dentro de este proceso, manteniendo la revisión de los resultados.

---

## 🚧 Estado y próximos pasos

El repositorio reúne avances de varias etapas académicas, desde navegación y catálogo hasta integración con Firebase, pedidos y herramientas del negocio.

**Prioridades para continuar:**

- Incorporar capturas actualizadas y una demostración reproducible.
- Ampliar las pruebas automatizadas de lógica y flujos críticos.
- Verificar de extremo a extremo los permisos y reglas de Firestore.
- Mejorar el manejo de errores y los estados de carga.
- Separar claramente las funciones demostrativas de las listas para uso real.
- Evaluar despliegue, monitoreo y validación con usuarios antes de un lanzamiento público.

Las funciones descritas corresponden a funcionalidades presentes en el código y la documentación del proyecto; no implican una auditoría completa ni un despliegue comercial verificado.

---

## 👥 Equipo y contexto

Proyecto académico colaborativo de la carrera de Ingeniería de Software, desarrollado por:

- **Esaú Lechuga Monge**
- **Jose Lavado Yañez**

La documentación de las etapas del proyecto se conserva en el historial y las ramas del repositorio.

---

## 📫 Enlaces

**[Repositorio](https://github.com/EsLechu19/BarrioGo)** · **[Perfil de GitHub](https://github.com/EsLechu19)** · **[LinkedIn](https://www.linkedin.com/in/esau-lechuga-monge-12b720362/)**
