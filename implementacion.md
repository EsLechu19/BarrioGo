# BarrioGo — App de Pedidos Directos para Negocios de Barrio
## 📘 Diario de Implementación Paso a Paso

Este documento guía el desarrollo de BarrioGo, alineado tanto al **temario del syllabus** como a la **rúbrica oficial de entregables** del curso (Avances 1, 2, 3 y Proyecto Final).

> ⚠️ **Cambio importante respecto a versiones anteriores:** la rúbrica oficial evalúa criterios distintos en cada fecha de lo que asumíamos inicialmente. En particular: la navegación se evalúa recién en APF2 (no en APF1), y APF3 exige autenticación real (Firebase Auth u otro) y persistencia en base de datos/API real — no solo AsyncStorage. Este documento ya refleja esos ajustes.

---

## 🎯 Objetivo del Proyecto
Crear una app móvil multiplataforma tipo "delivery de barrio" donde clientes puedan explorar negocios cercanos, hacer pedidos directos y hacerles seguimiento, mientras los negocios gestionan su menú y pedidos — con una comisión mucho menor a la de Rappi/PedidosYa.

## 💡 Modelo de Negocio (resumen)
Canal de pedidos directo y de bajo costo para clientes recurrentes de negocios de barrio (pollerías, chifas). No busca reemplazar a Rappi/PedidosYa, sino complementarlo: el negocio paga una cuota fija mensual o una comisión reducida (8-12% vs. 25-35% de las apps grandes).

## 🧱 Stack Tecnológico
- **Framework:** React Native (Expo) + **TypeScript**
- **Navegación:** React Navigation (Stack + Tab), configurada a mano
- **Estado local:** React Hooks (useState, useEffect) tipados
- **Persistencia local:** AsyncStorage
- **Autenticación real:** Firebase Auth (o similar)
- **Backend/Base de datos:** Firebase Firestore o Supabase (para persistencia real en APF3)
- **Consumo de datos:** Fetch / Axios
- **Hardware:** Expo Camera, Expo Location, Expo Notifications
- **Build:** EAS Build (Expo Application Services)
- **Control de versiones:** Git + GitHub, rama principal `master`

---

## 📊 Rúbrica oficial de entregables (referencia)

| Semana | Entregable | Qué se evalúa |
|---|---|---|
| 5 | APF1 | Idea y objetivos (20%) · Mockups/diseño inicial (20%) · Implementación de pantallas (40%) · Estilos/usabilidad (20%) |
| 10 | APF2 | Navegación implementada (25%) · Estados/eventos (25%) · Formulario funcional (25%) · Consumo de API (25%) |
| 15 | APF3 | Autenticación real (30%) · Persistencia de datos (30%) · Servicio externo (20%) · Flujo completo (20%) |
| 18 | Proyecto Final | Funcionalidad completa (40%) · Estabilidad/rendimiento (20%) · Calidad visual/UX (15%) · Buenas prácticas (15%) · Presentación (10%) |

---

## 🛠️ Registro de Progreso (Historial de Pasos)

### 🚧 Fase 1 — Idea, Mockups y Pantallas Básicas
*Corresponde a Unidad 1 (semanas 1-5) · Entregable: APF1 (Semana 5)*

**Step 1: Generación del Proyecto**
- Inicialización con `npx create-expo-app@latest --template blank-typescript`.
- Verificar `tsconfig.json` en la raíz y que el archivo de entrada (`main.ts`) coincida con el campo `"main"` de `package.json`.
- Arquitectura de carpetas: `src/screens`, `src/components`, `src/navigation`, `src/types`, `src/services`, `src/assets`.
- Repositorio en GitHub, rama principal `master`, convención `feature/nombre-feature`.

**Step 2: Documento de Idea y Objetivos** *(20% de APF1 — no es código)*
- Documento de 1 página: problema que resuelve BarrioGo, público objetivo, propuesta de valor, objetivos del proyecto.
- Basado en el modelo de negocio ya definido (comisión reducida frente a Rappi/PedidosYa).

**Step 3: Mockups Iniciales** *(20% de APF1 — no es código)*
- Bocetos/wireframes de las pantallas principales: Login, Home/Catálogo, Detalle de negocio.
- Pueden hacerse en Figma, o incluso a mano y escaneados/fotografiados.
- Deben mostrar la estructura visual antes de programarla.

**Step 4: Modelado de Datos (Interfaces)**
- Definición de interfaces en `src/types`: `Negocio`, `Producto`, `Pedido`, `Usuario`, y el tipo `EstadoPedido`.
- Se hace antes de maquetar pantallas para que los componentes reciban props tipadas desde el inicio.

**Step 5: Navegación Base (soporte, no evaluado aún)**
- Instalación de React Navigation (`@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`).
- Stack básico: Login → Home/Catálogo. Esto no se evalúa formalmente hasta APF2, pero es necesario para que las pantallas de APF1 sean navegables en la demo.

**Step 6: Pantallas Básicas** *(40% de APF1)*
- Pantalla de Login/Registro con `TextInput`, `Button`, `TouchableOpacity`.
- Pantalla de Home/Catálogo inicial con negocios hardcodeados (tipados como `Negocio[]`).
- Validaciones básicas en el login: campos vacíos, formato de email.

**Step 7: Estilos y Usabilidad** *(20% de APF1)*
- Estilos con Flexbox, `Dimensions` para distintos tamaños de pantalla.
- Consistencia visual básica (colores, tipografía) entre Login y Home.
- **Verificación:** `npx tsc --noEmit` sin errores, app corre en emulador, mockups y documento de idea listos para presentar junto al código.

---

### ⬜ Fase 2 — Navegación, Estados y Consumo de API
*Corresponde a Unidad 1 (cierre) + Unidad 2 (semanas 6-10) · Entregable: APF2 (Semana 10)*

**Step 8: Navegación Completa** *(25% de APF2)*
- Stack Navigator: Home → Detalle de Negocio → Carrito.
- Tab Navigator: Inicio, Pedidos, Favoritos, Perfil.
- Tipos de navegación (`RootStackParamList`, `TabParamList`) tipados.

**Step 9: Manejo de Estados y Eventos** *(25% de APF2)*
- Hooks `useState`/`useEffect` en pantallas dinámicas.
- Componentes interactivos: `Button`, `TouchableOpacity`, manejo de eventos táctiles.
- Lógica de carrito: agregar, quitar, actualizar cantidad, calcular total.

**Step 10: Formulario Funcional** *(25% de APF2)*
- Formulario de Login/Registro con validaciones completas y feedback visual de error.
- Estado del formulario tipado (`useState<{ email: string; password: string }>`).

**Step 11: Consumo de API** *(25% de APF2)*
- Servicio `src/services/api.ts` con Axios, tipando las respuestas (`Promise<Negocio[]>`, etc.).
- API pública o mock (JSON server) para negocios y menú.
- Manejo de estados de carga y error en cada fetch.

**Step 12: AsyncStorage y Temas** *(refuerza el flujo, según syllabus Unidad 2)*
- Persistencia de carrito y sesión con AsyncStorage.
- Favoritos de negocios.
- Modo claro/oscuro con Context API + AsyncStorage.
- **Verificación:** flujo completo Login → Home → Detalle → Carrito funcional, consumo de API real, `npx tsc --noEmit` sin errores.

---

### ⬜ Fase 3 — Autenticación Real, Persistencia y Hardware
*Corresponde a Unidad 3 (semanas 11-15) · Entregable: APF3 (Semana 15)*

**Step 13: Autenticación Real** *(30% de APF3 — NUEVO, no estaba en versiones anteriores)*
- Integración de Firebase Auth (o similar) para registro/login real, reemplazando el formulario simulado de la Fase 1.
- Manejo de sesión persistente (usuario sigue logueado al reabrir la app).

**Step 14: Persistencia de Datos en BD/API Real** *(30% de APF3 — NUEVO)*
- Migración de datos mock a una base de datos real (Firebase Firestore o Supabase): negocios, productos, pedidos.
- CRUD real de pedidos (crear, leer, actualizar estado).

**Step 15: Integración con Servicio Externo** *(20% de APF3)*
- Puede ser el propio backend de autenticación/BD (Firebase/Supabase) si no se usa otro servicio adicional, o un servicio externo adicional (ej. API de geocodificación).

**Step 16: Permisos y Hardware** *(según syllabus Unidad 3)*
- Solicitud de permisos de cámara y ubicación en Android e iOS.
- Expo Location: ordenar negocios por cercanía real.
- Expo Camera: negocio sube foto de producto.
- Expo Notifications: "pedido confirmado", "en camino", "entregado".

**Step 17: Manejo de Errores y Rendimiento**
- Manejo centralizado de errores (fetch fallido, GPS no disponible, cámara no disponible, fallo de autenticación).
- Revisión de renders innecesarios y warnings de consola.
- **Verificación:** flujo completo con autenticación real, datos persistidos en backend real, hardware funcional en dispositivo físico.

---

### ⬜ Fase 4 — Despliegue, Documentación y Cierre
*Corresponde a Unidad 4 (semanas 16-18) · Entregable: Proyecto Final (Semana 18)*

**Step 18: Funcionalidad Completa y Pulido** *(40% + 15% de Proyecto Final)*
- Revisión de consistencia visual (iconos, colores, tipografía) en todas las pantallas.
- Todas las features de las fases anteriores integradas y funcionando juntas.
- Buenas prácticas de código (organización de carpetas, sin código muerto, componentes reutilizables).

**Step 19: Estabilidad y Rendimiento** *(20% de Proyecto Final)*
- Pruebas end-to-end: flujo cliente completo y flujo negocio completo.
- Revisión de rendimiento en dispositivo físico (no solo emulador).

**Step 20: Generación del Build** *(parte de "Despliegue en dispositivo físico o emulador")*
- Configuración de EAS Build (`eas.json`, `eas build:configure`).
- Generación del APK para Android, probado en dispositivo real.

**Step 21: Documento de Arquitectura, Retos y Aprendizajes** *(NUEVO — pedido explícito de la rúbrica, distinto del doc. de modelo de negocio)*
- Diagrama o descripción de la arquitectura del proyecto (carpetas, flujo de datos, servicios).
- Principales retos técnicos enfrentados y cómo se resolvieron.
- Aprendizajes clave del equipo durante el desarrollo.

**Step 22: Documento de Modelo de Negocio** (complementario, para dar contexto de producto)
- Propuesta de valor, pricing, diferenciación frente a Rappi/PedidosYa.

**Step 23: Presentación Oral** *(10% de Proyecto Final)*
- Guion de demo (flujo cliente + flujo negocio).
- Preparación de respuestas a preguntas típicas: justificación de la comisión, prevención de fraude, plan de escalamiento, decisiones de arquitectura.

---

## 📌 Estado Actual
Proyecto en Fase 1, con la estructura del proyecto y tipos base en curso. Pendiente: documento de idea/objetivos, mockups, y pantallas básicas de Login/Home para completar APF1.