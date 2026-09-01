# BarrioGo — Issues por Fase (GitHub Projects / Kanban)

Cada issue está listo para copiar directamente a GitHub. Columnas sugeridas: **Backlog → To Do → In Progress → In Review → Done**.

**Labels sugeridas:** `fase-1` `fase-2` `fase-3` `fase-4` `frontend` `backend` `hardware` `bug` `docs` `types` `auth`

> 📌 **Actualizado según la rúbrica oficial de entregables.** Cambios clave respecto a versiones anteriores:
> - Navegación se evalúa en **APF2**, no en APF1 (aunque se configura una base en Fase 1 para poder navegar en la demo).
> - APF1 requiere **documento de idea/objetivos y mockups**, entregables que no son código (40% del total de APF1).
> - APF3 exige **autenticación real (Firebase Auth u otro) y persistencia en BD/API real** — no solo AsyncStorage.
> - Proyecto Final pide un **documento de arquitectura, retos y aprendizajes**, distinto del documento de modelo de negocio.

---

## 🟦 Fase 1 — Idea, Mockups y Pantallas Básicas (APF1 — Semana 5)

**Milestone:** `APF1 - Semana 5`
**Rúbrica de esta entrega:** Idea y objetivos (20%) · Mockups (20%) · Pantallas básicas (40%) · Estilos/usabilidad (20%)

- [ ] **#1 - Configurar proyecto con Expo + TypeScript**
  - Descripción: Inicializar con `npx create-expo-app@latest --template blank-typescript`, verificar `tsconfig.json` y que `main.ts` coincida con el campo `"main"` de `package.json`.
  - Criterio de aceptación: `npx expo start` levanta la app sin errores, `npx tsc --noEmit` sin errores, no existe `src/app` ni `expo-router` en dependencies.
  - Labels: `fase-1`

- [ ] **#2 - Definir arquitectura de carpetas**
  - Descripción: Crear `src/screens`, `src/components`, `src/navigation`, `src/services`, `src/assets`, `src/types`.
  - Criterio de aceptación: estructura documentada en el README y coincide con las carpetas reales del repo.
  - Labels: `fase-1` `docs`

- [ ] **#3 - Configurar repositorio y convención de ramas**
  - Descripción: Repo en GitHub, convención `feature/nombre`, proteger rama `master`.
  - Criterio de aceptación: todos los integrantes pueden clonar y crear ramas sin pushear directo a `master`.
  - Labels: `fase-1` `docs`

- [ ] **#4 - Documento de Idea y Objetivos del proyecto** *(20% de APF1)*
  - Descripción: Documento de 1 página: problema que resuelve BarrioGo, público objetivo, propuesta de valor y objetivos del proyecto, basado en el modelo de negocio ya definido.
  - Criterio de aceptación: documento claro, listo para presentar el día de la evaluación de APF1.
  - Labels: `fase-1` `docs`

- [ ] **#5 - Mockups iniciales de las pantallas principales** *(20% de APF1)*
  - Descripción: Bocetos/wireframes de Login, Home/Catálogo y Detalle de negocio (Figma o a mano, escaneado/fotografiado).
  - Criterio de aceptación: mockups muestran la estructura visual de al menos 3 pantallas antes de programarlas.
  - Labels: `fase-1` `docs`

- [ ] **#6 - Definir interfaces y tipos base del dominio**
  - Descripción: En `src/types`, interfaces `Negocio`, `Producto`, `Pedido`, `Usuario` y el tipo `EstadoPedido`.
  - Criterio de aceptación: las interfaces compilan sin errores y son importables desde cualquier pantalla.
  - Labels: `fase-1` `types`

- [ ] **#7 - Instalar React Navigation y Stack básico (soporte, no evaluado aún)**
  - Descripción: Instalar `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`. Configurar Stack básico Login → Home/Catálogo dentro de `src/navigation`.
  - Criterio de aceptación: se puede navegar de Login a Home y volver, sin errores.
  - Labels: `fase-1` `frontend` `types`

- [ ] **#8 - Pantalla de Login/Registro con validaciones** *(parte del 40% de "Pantallas básicas")*
  - Descripción: En `src/screens`, formulario con `TextInput`, `Button`, `TouchableOpacity`, estado tipado, validación de campos vacíos y formato de email.
  - Criterio de aceptación: el formulario rechaza datos inválidos con mensaje de error visible, sin errores de tipos.
  - Labels: `fase-1` `frontend`

- [ ] **#9 - Pantalla Home/Catálogo inicial** *(parte del 40% de "Pantallas básicas")*
  - Descripción: En `src/screens/HomeScreen.tsx`, lista de negocios hardcodeados tipados como `Negocio[]`, usando View/Text/Image.
  - Criterio de aceptación: se ven al menos 3 negocios de ejemplo con imagen, nombre y distancia falsa.
  - Labels: `fase-1` `frontend`

- [ ] **#10 - Estilos con Flexbox y consistencia visual** *(20% de APF1)*
  - Descripción: Aplicar Flexbox y `Dimensions` en Login y Home; unificar colores y tipografía entre ambas pantallas.
  - Criterio de aceptación: la app se ve consistente y correcta en al menos 2 tamaños de emulador distintos.
  - Labels: `fase-1` `frontend`

---

## 🟩 Fase 2 — Navegación, Estados y Consumo de API (APF2 — Semana 10)

**Milestone:** `APF2 - Semana 10`
**Rúbrica de esta entrega:** Navegación (25%) · Estados/eventos (25%) · Formulario funcional (25%) · Consumo de API (25%)

- [ ] **#11 - Completar Stack Navigator (Home → Detalle → Carrito)** *(parte del 25% de Navegación)*
  - Descripción: Dentro de `src/navigation`, agregar las rutas Detalle de Negocio y Carrito al Stack existente.
  - Criterio de aceptación: se puede navegar entre las 4 pantallas (Login, Home, Detalle, Carrito) y volver atrás.
  - Labels: `fase-2` `frontend`

- [ ] **#12 - Implementar Tab Navigator (Inicio, Pedidos, Favoritos, Perfil)** *(parte del 25% de Navegación)*
  - Descripción: Configurar navegación inferior con iconos, dentro de `src/navigation`, con tipos (`TabParamList`).
  - Criterio de aceptación: los 4 tabs cambian de pantalla correctamente.
  - Labels: `fase-2` `frontend` `types`

- [ ] **#13 - Lógica de carrito con estados y eventos** *(25% de "Estados/eventos")*
  - Descripción: Estado del carrito con hooks tipados (`useState<ItemPedido[]>`): agregar, quitar, actualizar cantidad, calcular total. Manejo de eventos táctiles (Button, TouchableOpacity).
  - Criterio de aceptación: agregar/quitar productos actualiza el total correctamente en pantalla.
  - Labels: `fase-2` `frontend`

- [ ] **#14 - Formulario de Login funcional al 100%** *(25% de "Formulario funcional")*
  - Descripción: Completar validaciones del formulario de la Fase 1 (longitud de contraseña, formato estricto de email, feedback visual claro).
  - Criterio de aceptación: ningún dato inválido pasa la validación, mensajes de error claros para cada campo.
  - Labels: `fase-2` `frontend`

- [ ] **#15 - Definir API mock o backend (Firebase/Supabase/JSON server)** *(base para "Consumo de API")*
  - Descripción: Elegir y configurar la fuente de datos para negocios, productos y pedidos.
  - Criterio de aceptación: se puede hacer un GET de prueba y recibir datos JSON.
  - Labels: `fase-2` `backend`

- [ ] **#16 - Crear servicio centralizado api.ts con Axios** *(25% de "Consumo de API")*
  - Descripción: En `src/services/api.ts`, centralizar llamadas HTTP tipadas (`getNegocios`, `getMenu`, `crearPedido`).
  - Criterio de aceptación: todas las pantallas consumen datos a través de este servicio, sin `any` en las firmas.
  - Labels: `fase-2` `backend` `types`

- [ ] **#17 - Refactor de Home a useState/useEffect consumiendo API real** *(25% de "Consumo de API")*
  - Descripción: Reemplazar datos hardcodeados por datos reales desde `api.ts`, con manejo de `loading` y `error`.
  - Criterio de aceptación: la lista de negocios cambia si se modifican los datos en el backend/mock, y se muestra spinner/error correctamente.
  - Labels: `fase-2` `frontend`

- [ ] **#18 - Persistencia de carrito y sesión con AsyncStorage** *(refuerzo, según syllabus Unidad 2)*
  - Descripción: Guardar carrito y sesión localmente, validando el tipo de los datos al leerlos.
  - Criterio de aceptación: al cerrar y reabrir la app, el carrito y la sesión se mantienen.
  - Labels: `fase-2` `backend`

- [ ] **#19 - Favoritos de negocios y tema claro/oscuro** *(refuerzo, según syllabus Unidad 2)*
  - Descripción: Favoritos con AsyncStorage; `ThemeContext` tipado (`type Theme = "light" | "dark"`) persistido en AsyncStorage.
  - Criterio de aceptación: favoritos y tema persisten al reabrir la app.
  - Labels: `fase-2` `frontend` `types`

---

## 🟨 Fase 3 — Autenticación Real, Persistencia y Hardware (APF3 — Semana 15)

**Milestone:** `APF3 - Semana 15`
**Rúbrica de esta entrega:** Autenticación real (30%) · Persistencia de datos (30%) · Servicio externo (20%) · Flujo completo (20%)

- [ ] **#20 - Integrar Firebase Auth (o similar)** *(30% de "Autenticación real" — NUEVO)*
  - Descripción: Reemplazar el login simulado por autenticación real con Firebase Auth (registro, login, logout, sesión persistente).
  - Criterio de aceptación: un usuario puede registrarse, cerrar la app, reabrirla y seguir logueado.
  - Labels: `fase-3` `auth` `backend`

- [ ] **#21 - Migrar datos a base de datos real (Firestore/Supabase)** *(30% de "Persistencia de datos" — NUEVO)*
  - Descripción: Mover negocios, productos y pedidos de mock/JSON a una base de datos real. CRUD real de pedidos (crear, leer, actualizar estado).
  - Criterio de aceptación: crear un pedido desde la app lo guarda en la base de datos real y es consultable después.
  - Labels: `fase-3` `backend`

- [ ] **#22 - Integración con servicio externo** *(20% de "Servicio externo")*
  - Descripción: Puede ser el propio Firebase/Supabase si no se usa un servicio adicional, o una API externa complementaria (ej. geocodificación).
  - Criterio de aceptación: el servicio externo elegido está integrado y documentado en el README.
  - Labels: `fase-3` `backend`

- [ ] **#23 - Solicitar permisos de ubicación (Android/iOS)**
  - Descripción: Flujo de solicitud de permiso con `expo-location`, con pantalla de fallback si se niega.
  - Criterio de aceptación: si el usuario niega el permiso, la app no crashea y explica qué hacer.
  - Labels: `fase-3` `hardware`

- [ ] **#24 - Solicitar permisos de cámara (Android/iOS)**
  - Descripción: Igual que el anterior pero con `expo-camera`.
  - Criterio de aceptación: manejo correcto de permiso denegado.
  - Labels: `fase-3` `hardware`

- [ ] **#25 - Integrar Expo Location y ordenar negocios por cercanía**
  - Descripción: Obtener ubicación del usuario y calcular distancia real a cada negocio.
  - Criterio de aceptación: la lista de Home se reordena según la ubicación actual del dispositivo.
  - Labels: `fase-3` `hardware`

- [ ] **#26 - Integrar Expo Camera en perfil de negocio**
  - Descripción: Permitir tomar foto de un producto y asociarla al menú.
  - Criterio de aceptación: la foto tomada se muestra en el detalle del producto.
  - Labels: `fase-3` `hardware`

- [ ] **#27 - Configurar Expo Notifications y notificar estado de pedido**
  - Descripción: Notificaciones locales: "pedido confirmado", "en camino", "entregado", según `EstadoPedido`.
  - Criterio de aceptación: cada cambio de estado dispara su notificación correspondiente.
  - Labels: `fase-3` `hardware`

- [ ] **#28 - Manejo centralizado de errores** *(parte del 20% de "Flujo completo")*
  - Descripción: Capturar errores de fetch, auth, GPS no disponible, cámara no disponible, con un tipo `AppError` definido.
  - Criterio de aceptación: ningún error provoca un crash total de la app.
  - Labels: `fase-3` `bug` `types`

- [ ] **#29 - Prueba de flujo completo end-to-end** *(20% de "Flujo completo")*
  - Descripción: Probar: registro real → login → explorar → pedido → persistencia en BD → notificación.
  - Criterio de aceptación: flujo completo sin errores en dispositivo físico.
  - Labels: `fase-3` `bug`

---

## 🟥 Fase 4 — Despliegue, Documentación y Cierre (Proyecto Final — Semana 18)

**Milestone:** `Proyecto Final - Semana 18`
**Rúbrica de esta entrega:** Funcionalidad completa (40%) · Estabilidad/rendimiento (20%) · Calidad visual/UX (15%) · Buenas prácticas (15%) · Presentación (10%)

- [ ] **#30 - Revisión de consistencia visual (UI/UX)** *(15% de "Calidad visual/UX")*
  - Descripción: Unificar colores, tipografía e iconos en todas las pantallas.
  - Criterio de aceptación: checklist de UI revisado por todo el equipo.
  - Labels: `fase-4` `frontend`

- [ ] **#31 - Revisión de buenas prácticas de código** *(15% de "Buenas prácticas")*
  - Descripción: Revisar organización de carpetas, eliminar código muerto/comentado, componentes reutilizables, nombres consistentes.
  - Criterio de aceptación: sin warnings críticos, código organizado según la arquitectura documentada.
  - Labels: `fase-4` `docs`

- [ ] **#32 - Prueba end-to-end flujo cliente completo** *(parte del 40% de "Funcionalidad completa")*
  - Descripción: Registro → login → explorar → pedido → seguimiento → notificación → historial.
  - Criterio de aceptación: flujo completo sin errores en dispositivo físico.
  - Labels: `fase-4` `bug`

- [ ] **#33 - Prueba end-to-end flujo negocio completo** *(parte del 40% de "Funcionalidad completa")*
  - Descripción: Login negocio → subir producto con cámara → recibir/gestionar pedido.
  - Criterio de aceptación: flujo completo sin errores en dispositivo físico.
  - Labels: `fase-4` `bug`

- [ ] **#34 - Revisión de estabilidad y rendimiento** *(20% de "Estabilidad/rendimiento")*
  - Descripción: Probar en dispositivo físico (no solo emulador), revisar tiempos de carga y fluidez.
  - Criterio de aceptación: sin crashes ni lags perceptibles durante la demo.
  - Labels: `fase-4` `bug`

- [ ] **#35 - Configurar EAS Build y generar APK**
  - Descripción: Configurar `eas.json` y generar el build de Android.
  - Criterio de aceptación: APK instalable generado y probado en un dispositivo real.
  - Labels: `fase-4` `backend`

- [ ] **#36 - Documento de arquitectura, retos y aprendizajes** *(NUEVO — pedido explícito de la rúbrica)*
  - Descripción: Documento con diagrama/descripción de arquitectura (carpetas, flujo de datos, servicios), principales retos técnicos y cómo se resolvieron, y aprendizajes del equipo.
  - Criterio de aceptación: documento de 2-3 páginas listo para entregar junto al proyecto.
  - Labels: `fase-4` `docs`

- [ ] **#37 - Documento de modelo de negocio** (complementario)
  - Descripción: Propuesta de valor, pricing y diferenciación frente a Rappi/PedidosYa.
  - Criterio de aceptación: documento de 1-2 páginas listo para sustentación.
  - Labels: `fase-4` `docs`

- [ ] **#38 - Guion de demo y preparación de sustentación oral** *(10% de "Presentación")*
  - Descripción: Definir qué se muestra en vivo (flujo cliente + flujo negocio), y preparar respuestas a preguntas típicas (comisión, fraude, escalamiento, arquitectura).
  - Criterio de aceptación: guion escrito y ensayado por el equipo.
  - Labels: `fase-4` `docs`

---

## 💡 Cómo montarlo en GitHub Projects

1. Crea un **Project (Board)** en tu repo con vista "Board" (Kanban).
2. Crea las columnas: `Backlog`, `To Do`, `In Progress`, `In Review`, `Done`.
3. Crea las **Labels** y **Milestones** indicados arriba antes de cargar los issues.
4. Copia cada issue de esta lista a **New Issue**, asigna label, milestone y responsable.
5. Arrastra cada issue por las columnas a medida que el equipo avanza.