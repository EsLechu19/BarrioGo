# BarrioGo
## Informe académico — Avance de Proyecto Final 02

**Título:** Desarrollo de una aplicación móvil multiplataforma para la consulta de negocios gastronómicos y gestión de pedidos directos

**Autores:**

- Lechuga Monge, Esaú Alexander — U23203849
- Lavado Yañez, Jose — U23203374

**Docente o asesor:** [Completar con el nombre oficial indicado por la universidad]

**Institución:** [Completar]

**Curso:** [Completar]

**Lima — Perú**  
**2026**

> **Alcance del documento:** este informe describe exclusivamente el avance APF2 implementado en la rama `feature/apf2-ui-unido`. Las integraciones posteriores de Firebase, panel de negocio, Cloudinary y notificaciones no forman parte de los resultados principales de esta entrega.

---

## INTRODUCCIÓN

Los pequeños negocios gastronómicos requieren mecanismos digitales que les permitan presentar su oferta de manera ordenada y facilitar la interacción con sus clientes. Sin embargo, un canal basado únicamente en mensajes dificulta la consulta del menú, el control de cantidades, la conservación de preferencias y la visualización organizada de los negocios disponibles.

BarrioGo se plantea como un prototipo móvil orientado a resolver la primera etapa de este problema: ofrecer una interfaz centralizada para consultar negocios gastronómicos, revisar sus productos, gestionar favoritos y administrar un carrito de compras. El producto se desarrolló con React Native y Expo, utilizando TypeScript, React Navigation, una API mock local y persistencia mediante AsyncStorage.

El presente informe documenta el alcance APF2, la organización del proyecto, los requerimientos identificados, las decisiones de diseño, la implementación de componentes y Hooks, el consumo de datos, las pruebas funcionales y los resultados obtenidos. La evaluación se limita a las funcionalidades efectivamente disponibles en `feature/apf2-ui-unido` y evita atribuir al prototipo capacidades que corresponden a etapas posteriores.

## ÍNDICE

1. [Capítulo I: Aspectos de la organización](#1-capítulo-i-aspectos-de-la-organización)  
   1.1. [Visión](#11-visión)  
   1.2. [Misión](#12-misión)  
   1.3. [Reseña histórica](#13-reseña-histórica)  
   1.4. [Organigrama](#14-organigrama)  
   1.5. [Ámbito del proyecto](#15-ámbito-del-proyecto)  
   1.6. [Funciones y procesos del negocio](#16-descripción-de-funciones-y-procesos-del-negocio)  
2. [Capítulo II: Aspectos del proyecto](#2-capítulo-ii-aspectos-del-proyecto)  
3. [Capítulo III: Método de desarrollo del producto observable](#3-capítulo-iii-método-de-desarrollo-del-producto-observable)  
4. [Capítulo IV: Resultados](#4-capítulo-iv-resultados)  
5. [Capítulo V: Conclusiones](#5-capítulo-v-conclusiones)  
6. [Capítulo VI: Recomendaciones](#6-capítulo-vi-recomendaciones)  
7. [Referencias bibliográficas](#7-referencias-bibliográficas)  
8. [Anexos](#8-anexos)

---

# 1. CAPÍTULO I: ASPECTOS DE LA ORGANIZACIÓN

## 1.1. Visión

Ser una solución tecnológica móvil de referencia para la digitalización progresiva de los negocios gastronómicos de barrio, facilitando una relación directa, organizada y sostenible entre los establecimientos y sus clientes mediante herramientas accesibles, intuitivas y adaptables a las necesidades del comercio local.

## 1.2. Misión

Desarrollar una aplicación móvil multiplataforma que permita a los clientes descubrir negocios gastronómicos cercanos, consultar sus catálogos, gestionar favoritos y organizar sus pedidos mediante una experiencia de usuario clara y confiable. BarrioGo busca aplicar navegación móvil, consumo de datos, persistencia local y geolocalización para contribuir a la modernización de los canales de atención de pequeños establecimientos gastronómicos.

## 1.3. Reseña histórica

BarrioGo se originó como un proyecto académico de desarrollo móvil orientado a explorar una alternativa digital para la interacción entre clientes y negocios gastronómicos de barrio. La primera etapa estuvo enfocada en definir el dominio del problema, las pantallas iniciales y los tipos de datos necesarios para representar negocios, productos, usuarios y pedidos.

Posteriormente, el proyecto evolucionó hacia un prototipo funcional en React Native y Expo. En el avance APF2 se incorporaron la navegación tipada, el catálogo dinámico, la consulta mediante API mock, los formularios validados, el carrito, los favoritos, la persistencia local y el ordenamiento por ubicación. Asimismo, la rama `feature/apf2-ui-unido` integró un sistema visual consistente y componentes reutilizables para mejorar la experiencia de uso sin alterar la lógica principal del prototipo.

## 1.4. Organigrama

El proyecto cuenta con una estructura académica y colaborativa. La ejecución técnica se encuentra a cargo de los dos integrantes, mientras que el docente o asesor realiza la supervisión metodológica y la evaluación del avance.

```text
Docente o asesor académico
│
└── Equipo de desarrollo BarrioGo
    ├── Lechuga Monge, Esaú Alexander
    │   └── Desarrollo de aplicación, navegación, componentes e integración funcional
    └── Lavado Yañez, Jose
        └── Desarrollo colaborativo, UI/UX, componentes, validación y documentación
```

Las responsabilidades se desarrollan de forma colaborativa y pueden distribuirse según la tarea o etapa del proyecto. El organigrama representa la coordinación académica y técnica del equipo, no una estructura empresarial de producción.

## 1.5. Ámbito del proyecto

BarrioGo se desarrolla como un prototipo móvil académico aplicable al contexto de pequeños negocios gastronómicos de Lima Metropolitana. El alcance APF2 se concentra en el flujo de consulta y organización de pedidos desde la perspectiva del cliente.

### 1.5.1. Área de aplicación

El prototipo está orientado a pollerías, chifas y negocios de menú que requieran mostrar sus productos y facilitar la interacción con clientes mediante una aplicación móvil. La validación se realiza con datos representativos de negocios y productos, sin afirmar todavía una operación comercial productiva.

### 1.5.2. Recursos humanos

| Participante | Responsabilidad principal |
|---|---|
| Lechuga Monge, Esaú Alexander | Desarrollo de la aplicación, navegación, componentes e integración funcional. |
| Lavado Yañez, Jose | Desarrollo colaborativo de la interfaz, experiencia de usuario, componentes y validación. |
| Docente o asesor académico | Orientación metodológica, revisión y evaluación del entregable. |
| Usuarios de prueba | Validación básica del flujo de navegación y de las funciones principales. |

### 1.5.3. Software

- Visual Studio Code.
- React Native con Expo SDK 57.
- TypeScript.
- React Navigation, con Stack Navigator y Bottom Tab Navigator.
- Node.js y npm.
- Fetch API.
- AsyncStorage.
- Expo Location.
- Expo Image Picker, como dependencia disponible para etapas posteriores y selección de imágenes.
- Git y GitHub.
- Expo Go para la ejecución durante el desarrollo.
- `scripts/mock-server.js` como API mock local.
- Archivos JSON para los datos de negocios y productos.

### 1.5.4. Hardware

- Computadora portátil para el desarrollo y ejecución del entorno Expo.
- Dispositivo móvil Android compatible con Expo Go o emulador Android.
- Conexión a Internet para instalar dependencias y consultar documentación.
- Red Wi-Fi compartida entre la computadora y el dispositivo cuando se utiliza Expo Go.
- GPS del dispositivo móvil para validar el ordenamiento por cercanía.

### 1.5.5. Cronograma de actividades

| Etapa | Actividades | Producto verificable |
|---|---|---|
| Semana 1 | Análisis del problema, definición del alcance y modelado inicial del dominio. | Requerimientos y tipos principales definidos. |
| Semana 2 | Configuración de Expo, TypeScript y estructura modular del proyecto. | Proyecto ejecutable con carpetas organizadas. |
| Semana 3 | Implementación de autenticación, pantallas base y navegación Stack/Tabs. | Flujo inicial de acceso y navegación. |
| Semana 4 | Implementación del catálogo, API mock y carga de negocios. | Catálogo dinámico con `FlatList`. |
| Semana 5 | Desarrollo del detalle, menú y búsqueda de negocios. | Consulta de negocio y productos. |
| Semana 6 | Implementación de favoritos, carrito y persistencia con AsyncStorage. | Gestión local de preferencias y carrito. |
| Semana 7 | Integración de GPS, permisos y sistema visual consistente. | Ordenamiento por cercanía y UI consolidada. |
| Semana 8 | Pruebas funcionales, correcciones, verificación de tipos y documentación. | Prototipo APF2 listo para presentación. |

## 1.6. Descripción de funciones y procesos del negocio

El proceso principal inicia cuando el usuario accede a la aplicación y consulta el catálogo de negocios disponibles. Puede buscar un establecimiento, revisar su información y consultar los productos que ofrece. Después, selecciona los productos que desea agregar al carrito y modifica las cantidades según su necesidad.

De forma complementaria, el usuario puede marcar negocios como favoritos. Estas preferencias y el contenido del carrito se conservan localmente mediante AsyncStorage. La ubicación del dispositivo puede utilizarse para ordenar los negocios por cercanía; si el permiso es rechazado o no existe una posición disponible, el sistema mantiene el catálogo utilizando el orden de datos disponible.

El proceso concluye con la confirmación del pedido dentro del prototipo. La gestión logística, el pago electrónico y el rastreo de un repartidor no forman parte del alcance APF2.

---

# 2. CAPÍTULO II: ASPECTOS DEL PROYECTO

## 2.1. Análisis situacional

Los pequeños negocios gastronómicos suelen gestionar parte de su atención mediante canales dispersos, como mensajes, llamadas o publicaciones en redes sociales. Estos medios permiten comunicarse con el cliente, pero no necesariamente ofrecen una estructura uniforme para consultar productos, seleccionar cantidades, conservar preferencias o revisar el contenido de un pedido.

En este contexto, se identifica la necesidad de un prototipo móvil que concentre la consulta de negocios y productos en una interfaz organizada. La solución no pretende reemplazar en esta etapa los sistemas productivos de delivery, sino validar técnicamente un flujo básico de catálogo, favoritos, carrito y pedido utilizando tecnologías móviles y datos controlados.

## 2.2. Formulación del problema

### 2.2.1. Problema general

¿Cómo puede una aplicación móvil multiplataforma mejorar la consulta de negocios gastronómicos y la organización de pedidos de clientes mediante una interfaz centralizada, persistencia local y geolocalización?

### 2.2.2. Problemas específicos

1. ¿Cómo presentar negocios y productos de forma organizada dentro de una aplicación móvil?
2. ¿Cómo permitir que el usuario seleccione productos, modifique cantidades y conserve el contenido del carrito?
3. ¿Cómo gestionar favoritos y sesión sin perder la información al cerrar la aplicación?
4. ¿Cómo ordenar los negocios por cercanía sin bloquear el funcionamiento cuando el usuario rechaza el permiso de ubicación?
5. ¿Cómo mantener una experiencia de navegación consistente mediante componentes reutilizables y estados de carga, error y ausencia de resultados?

## 2.3. Objetivos del proyecto

### 2.3.1. Objetivo general

Desarrollar un prototipo de aplicación móvil multiplataforma que centralice la consulta de negocios gastronómicos, la visualización de productos y la organización de pedidos, aplicando navegación móvil, consumo de datos, persistencia local y geolocalización.

### 2.3.2. Objetivos específicos

1. Implementar una navegación móvil tipada mediante Stack Navigator y Bottom Tab Navigator.
2. Desarrollar un catálogo de negocios y productos utilizando una API mock local y archivos JSON.
3. Implementar pantallas de detalle, favoritos y carrito de compras.
4. Aplicar validaciones en los formularios de autenticación y en las operaciones principales del usuario.
5. Persistir la sesión, los favoritos y el carrito mediante AsyncStorage.
6. Integrar la ubicación del dispositivo para ordenar los negocios por cercanía, manteniendo un comportamiento alternativo cuando el permiso no está disponible.
7. Consolidar un sistema visual basado en componentes reutilizables, colores consistentes, espaciado uniforme y adaptación a diferentes pantallas.

## 2.4. Fundamentación teórica

### React Native

React Native es un framework que permite construir interfaces móviles utilizando JavaScript o TypeScript y componentes de React. En BarrioGo se utiliza para implementar las pantallas y los componentes reutilizables del prototipo.

### Expo

Expo proporciona herramientas y módulos que simplifican el desarrollo de aplicaciones React Native. En este proyecto se utiliza Expo SDK 57 para ejecutar la aplicación, acceder a funcionalidades del dispositivo y facilitar las pruebas mediante Expo Go.

### React Navigation

React Navigation permite organizar el desplazamiento entre pantallas. BarrioGo utiliza un Stack Navigator para los flujos de autenticación y pantallas secundarias, y un Bottom Tab Navigator para las secciones principales de la aplicación.

### Fetch API y API mock

Fetch API permite realizar solicitudes HTTP desde JavaScript. En APF2 se utiliza para consultar el servidor mock local implementado en `scripts/mock-server.js`. Cuando la fuente remota no está disponible, el sistema utiliza datos JSON locales como respaldo.

### Hooks

Los Hooks son funciones de React que permiten gestionar estado, efectos secundarios y valores derivados dentro de componentes funcionales. El proyecto utiliza `useState`, `useEffect`, `useMemo`, `useCallback` y Hooks personalizados para controlar la carga de datos, la interacción, la persistencia y la ubicación.

### AsyncStorage

AsyncStorage es un mecanismo de almacenamiento local clave-valor para aplicaciones React Native. En BarrioGo se utiliza para conservar la sesión, los favoritos y el contenido del carrito. Al no ser un almacén cifrado, no debe utilizarse para guardar contraseñas ni secretos.

### Geolocalización y permisos

La geolocalización permite obtener las coordenadas aproximadas del dispositivo mediante `expo-location`. Debido a que la ubicación es un dato sensible, la aplicación solicita permiso en tiempo de ejecución y contempla un comportamiento alternativo cuando el permiso es rechazado o la posición no está disponible.

### Componentes reutilizables y diseño responsive

La reutilización de componentes permite mantener consistencia visual y reducir duplicación. El proyecto incorpora componentes para formularios, botones, tarjetas, estados de carga, estados vacíos, encabezados y controles de cantidad. El diseño responsive busca conservar la legibilidad y la interacción en distintos tamaños de pantalla.

### Tecnologías fuera del alcance APF2

Firebase, Cloudinary, notificaciones locales, generación de APK mediante EAS Build y funciones avanzadas del panel de negocio corresponden a evoluciones posteriores del proyecto. No se presentan como resultados de esta entrega.

---

# 3. CAPÍTULO III: MÉTODO DE DESARROLLO DEL PRODUCTO OBSERVABLE

## 3.1. Análisis de requerimientos

El análisis se realizó a partir del flujo principal del cliente y de los criterios de evaluación del avance. Se priorizaron las funciones necesarias para consultar negocios, seleccionar productos, administrar preferencias y conservar información local.

### Requerimientos funcionales

- El sistema debe permitir registrar e iniciar sesión con validación de campos.
- El sistema debe mostrar un catálogo de negocios y permitir buscar por nombre.
- El sistema debe permitir visualizar el detalle y el menú de un negocio.
- El usuario debe poder agregar, quitar y modificar cantidades de productos.
- El sistema debe calcular el total del carrito.
- El usuario debe poder marcar y desmarcar negocios como favoritos.
- El sistema debe conservar sesión, favoritos y carrito localmente.
- El sistema debe solicitar permiso de ubicación y ordenar negocios por cercanía cuando existan coordenadas válidas.
- El sistema debe mantener el acceso al catálogo cuando el permiso GPS sea rechazado.
- La interfaz debe mostrar estados de carga, error, vacío y contenido.

### Requerimientos no funcionales

- El código debe estar organizado por responsabilidades en `screens`, `components`, `services`, `context`, `hooks`, `navigation`, `types` y `data`.
- La aplicación debe ejecutarse en Expo SDK 57 y TypeScript estricto.
- Las consultas y operaciones con datos deben manejar errores sin cerrar inesperadamente la aplicación.
- Los datos externos deben validarse antes de utilizarse en la interfaz.
- La interfaz debe conservar una jerarquía visual consistente en las pantallas principales.
- El proyecto no debe versionar archivos `.env`, credenciales ni claves privadas.
- El proyecto debe verificarse con `npx tsc --noEmit` antes de presentarse.

## 3.2. Diseño

### Arquitectura del sistema

La solución utiliza una arquitectura cliente-servidor simplificada. La aplicación móvil funciona como cliente y se organiza en las siguientes capas:

```text
Pantallas y componentes React Native
            │
            ▼
Contextos y Hooks de estado
            │
            ▼
Servicios de datos (api.ts, storage.ts, location.ts)
            │
      ┌─────┴─────┐
      ▼           ▼
API mock       JSON local
```

`api.ts` centraliza las lecturas del catálogo. `storage.ts` encapsula la persistencia local y `location.ts` concentra la solicitud de permisos, la lectura de coordenadas y el cálculo de distancia. Esta separación evita que las pantallas implementen directamente la lógica de acceso a datos.

### Navegación entre pantallas

La navegación se implementa con React Navigation:

- `AuthNavigator`: flujo de autenticación, Splash, Login y Register.
- `AppNavigator`: navegación principal de la aplicación.
- `TabNavigator`: Inicio, Pedidos, Favoritos y Perfil.
- Stack principal: acceso a Detalle y Carrito, además de pantallas auxiliares.

La rama no utiliza Drawer. La combinación Stack + Bottom Tabs cubre la navegación definida para este avance.

### Diseño visual

El diseño de la interfaz utiliza componentes reutilizables, una paleta de colores centralizada y estilos consistentes. La rama `feature/ui-consistencia`, integrada en `feature/apf2-ui-unido`, aporta componentes como tarjetas de negocios, encabezados, botones primarios, estados vacíos, mensajes informativos y controles de cantidad.

El diseño prioriza la jerarquía visual, la lectura rápida del catálogo, la identificación de acciones principales y la adaptación de las pantallas a dispositivos móviles.

## 3.3. Desarrollo

### Configuración del entorno Expo

El proyecto se configuró con Expo SDK 57, React Native, TypeScript y React Navigation. La instalación de dependencias se realiza mediante:

```powershell
npm install
```

La aplicación puede ejecutarse con:

```powershell
npx expo start -c
```

### Implementación de componentes y Hooks

Las pantallas se desarrollaron como componentes funcionales. Se utilizaron Hooks para controlar estados de carga, formularios, búsqueda, favoritos, carrito, sesión y ubicación. También se emplearon Contextos para compartir el estado del carrito, favoritos y autenticación entre distintas pantallas.

### Consumo de API mock

El servidor local se inicia mediante:

```powershell
npm run mock-api
```

La aplicación consulta el catálogo mediante `fetch` y valida la estructura de la respuesta antes de renderizarla. Si el servidor no está disponible, utiliza el contenido local de los archivos JSON para mantener una experiencia demostrable.

### Persistencia local

AsyncStorage se utiliza para conservar información no sensible relacionada con la experiencia del usuario. El carrito y los favoritos se serializan, se guardan de forma asíncrona y se validan al recuperarse para evitar utilizar datos con una estructura incorrecta.

### Manejo de GPS

La aplicación solicita permiso de ubicación en primer plano. Cuando existe una ubicación conocida, los negocios pueden ordenarse mediante la fórmula de distancia entre coordenadas. Si no se obtiene una posición válida, el sistema conserva el catálogo y utiliza un ordenamiento alternativo.

### Gestión de permisos

El permiso de ubicación se solicita únicamente cuando la funcionalidad lo requiere. El rechazo del permiso no bloquea la aplicación ni impide consultar el catálogo. La cámara, las notificaciones push y el acelerómetro no forman parte del alcance funcional principal de APF2.

### Generación de APK

La generación de un APK mediante EAS Build no forma parte de los resultados verificables de esta entrega. Se considera una actividad de despliegue posterior. Para esta fase, la validación se realiza mediante Expo Go y, cuando está disponible, un dispositivo móvil físico.

## 3.4. Pruebas

Se aplicó una estrategia de pruebas funcionales de caja negra sobre los flujos principales de la aplicación. Las pruebas se ejecutaron mediante interacción directa con el prototipo y verificación de resultados visibles.

### Casos principales

| Caso | Acción | Resultado esperado |
|---|---|---|
| CP-01 | Enviar Login con campos vacíos. | Se muestran mensajes de validación. |
| CP-02 | Registrar una cuenta con correo inválido. | El formulario rechaza el dato y muestra una explicación. |
| CP-03 | Consultar el catálogo. | Se muestran negocios en una `FlatList`. |
| CP-04 | Buscar un negocio. | La lista se filtra según el texto ingresado. |
| CP-05 | Abrir un negocio. | Se muestra su detalle y sus productos. |
| CP-06 | Agregar y modificar productos. | El carrito actualiza cantidades y total. |
| CP-07 | Reiniciar la aplicación con datos guardados. | Se recuperan sesión, favoritos y carrito según corresponda. |
| CP-08 | Rechazar el permiso GPS. | La aplicación continúa mostrando el catálogo. |
| CP-09 | Apagar la API mock. | Se muestra una advertencia y se utilizan datos locales de respaldo. |
| CP-10 | Ejecutar `npx tsc --noEmit`. | El proyecto termina sin errores de TypeScript. |

No se presentan mediciones de rendimiento como tiempos máximos de carga porque no se estableció una prueba instrumental con métricas reproducibles en esta entrega.

---

# 4. CAPÍTULO IV: RESULTADOS

## 4.1. Resultado funcional

El avance APF2 produjo un prototipo móvil funcional con navegación Stack y Bottom Tabs, consulta de negocios, detalle de productos, favoritos, carrito y persistencia local. El sistema también incorpora validación de formularios, estados de carga, estados vacíos y manejo de errores de consulta.

## 4.2. Evidencias de la interfaz

Insertar capturas reales de:

1. Pantalla Splash.
2. Pantalla Login.
3. Pantalla Register con validación.
4. Home con listado de negocios.
5. Detalle de negocio y productos.
6. Favoritos.
7. Carrito con cantidades y total.
8. Pantalla Pedidos.
9. Mensaje de fallback cuando la API local no está disponible.

> **Evidencia requerida:** cada captura debe incluir una breve descripción de la acción realizada y el resultado observado.

## 4.3. Evidencia del consumo de datos

El servidor mock se inicia con `npm run mock-api` y expone el catálogo de negocios en:

```text
GET http://localhost:3000/negocios
```

Insertar una captura de la terminal o del navegador mostrando la respuesta JSON real del servidor mock. No debe incluirse una respuesta inventada si no coincide con los datos vigentes del proyecto.

## 4.4. Evidencia de AsyncStorage

Validar mediante la aplicación que el carrito y los favoritos se mantienen después de cerrar y abrir nuevamente la aplicación. Insertar:

- Captura del carrito antes de cerrar la aplicación.
- Captura del carrito después de volver a abrirla.
- Captura equivalente para favoritos, si corresponde.

## 4.5. Evidencia de GPS y permisos

Insertar capturas de los siguientes escenarios:

- Permiso de ubicación aceptado y negocios ordenados por cercanía.
- Permiso de ubicación rechazado y catálogo disponible mediante el orden alternativo.

La cámara, las notificaciones push y el APK no deben presentarse como resultados APF2 si no existen evidencias específicas y verificables.

## 4.6. Verificación técnica

El proyecto se verifica mediante:

```powershell
npx tsc --noEmit
```

Resultado observado en la rama `feature/apf2-ui-unido`: el comando finaliza sin errores de TypeScript.

---

# 5. CAPÍTULO V: CONCLUSIONES

1. Se desarrolló un prototipo móvil funcional que permite consultar negocios gastronómicos, visualizar productos, gestionar favoritos y organizar un carrito de compras.

2. La combinación de React Native, Expo y React Navigation permitió implementar una estructura multiplataforma con navegación Stack y Bottom Tabs, manteniendo una separación clara entre los flujos de autenticación y las funciones principales de la aplicación.

3. El consumo de una API mock mediante `fetch`, complementado con archivos JSON de respaldo, permitió validar el manejo de datos dinámicos sin depender de un backend productivo durante esta etapa.

4. La incorporación de AsyncStorage permitió conservar información relevante para la experiencia del usuario, como el carrito y los favoritos, después de reiniciar la aplicación.

5. La integración de la geolocalización y de un flujo alternativo ante el rechazo de permisos demostró la importancia de diseñar funcionalidades móviles tolerantes a fallos de hardware y permisos.

6. La integración del sistema visual de `feature/ui-consistencia` mejoró la coherencia de la interfaz mediante componentes reutilizables, estilos centralizados y estados visuales diferenciados.

7. El avance valida la viabilidad técnica del prototipo APF2, pero no permite concluir todavía que la solución esté preparada para una operación comercial productiva. Para ello se requieren backend productivo, seguridad de datos, pagos, pruebas de carga y validación con usuarios reales.

---

# 6. CAPÍTULO VI: RECOMENDACIONES

1. Integrar un backend productivo que permita autenticar usuarios, administrar negocios, almacenar productos y registrar pedidos de forma persistente y segura.

2. Definir reglas de autorización por rol y por negocio antes de habilitar operaciones administrativas en un entorno real.

3. Incorporar pruebas automatizadas para componentes, validadores, contextos y servicios de datos.

4. Medir el rendimiento con métricas reproducibles de tiempo de carga, memoria y respuesta de las operaciones principales antes de establecer compromisos de rendimiento.

5. Implementar mecanismos de pago electrónico y confirmar las condiciones de entrega como parte de una etapa posterior.

6. Incorporar notificaciones remotas únicamente después de definir el backend, la gestión de tokens y la política de permisos correspondiente.

7. Generar un APK o un Android App Bundle mediante EAS Build cuando se complete la configuración de despliegue y exista evidencia de pruebas en dispositivos reales.

8. Revisar la política de privacidad, el tratamiento de la ubicación y la protección de datos antes de publicar la aplicación en una tienda.

---

# 7. REFERENCIAS BIBLIOGRÁFICAS

Expo. (2026). *Expo documentation*. https://docs.expo.dev/

Expo. (2026). *Location — Expo Documentation*. https://docs.expo.dev/versions/v57.0.0/sdk/location/

Meta Open Source. (2026). *React Native documentation*. https://reactnative.dev/docs/getting-started

Meta Open Source. (2026). *Using Hooks*. https://react.dev/reference/react

React Navigation. (2026). *React Navigation documentation*. https://reactnavigation.org/docs/getting-started

React Native Community. (2026). *AsyncStorage documentation*. https://react-native-async-storage.github.io/async-storage/

Mozilla Developer Network. (2026). *Fetch API*. https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

> Ajustar las referencias al formato APA o ISO solicitado por la institución y verificar la fecha de consulta antes de entregar.

---

# 8. ANEXOS

## Anexo A. Diagrama de navegación

```text
AuthNavigator
├── Splash
├── Login
└── Register

AppNavigator
├── TabNavigator
│   ├── Inicio
│   ├── Pedidos
│   ├── Favoritos
│   └── Perfil
├── Detalle
└── Carrito
```

## Anexo B. Diagrama de flujo del cliente

```text
Inicio
  ↓
Autenticación
  ↓
Consulta de negocios
  ↓
Selección de negocio
  ↓
Consulta de productos
  ↓
Agregar al carrito
  ↓
Modificar cantidades
  ↓
Confirmar pedido
```

## Anexo C. Fragmentos de código

Insertar fragmentos reales y breves de:

- Consulta mediante `fetch`.
- Uso de `useEffect` para cargar datos.
- Persistencia con AsyncStorage.
- Solicitud de permiso GPS.
- Cálculo del total del carrito.

Cada fragmento debe incluir la ruta del archivo y una explicación de su función.

## Anexo D. Manual de ejecución

```powershell
npm install
npm run mock-api
npx expo start -c
```

Para ejecutar la aplicación en un dispositivo físico, el teléfono y la computadora deben estar conectados a la misma red Wi-Fi. La validación puede realizarse mediante Expo Go o un emulador compatible.

## Anexo E. Evidencias de validación

Incluir las capturas reales de los casos de prueba descritos en el capítulo IV. No dejar marcadores como `[INSERTAR CAPTURA]` en la versión final entregada.
