# BarrioGo
App móvil de pedidos directos para negocios de barrio (pollerías, chifas) con una comisión mucho menor a la de Rappi/PedidosYa. Pensada para clientes recurrentes que ya conocen el negocio, y para los dueños de negocios que gestionan su menú y sus pedidos desde la misma app.

## Stack
- Lenguaje: TypeScript (estricto, sin `any` salvo justificación)
- Framework / runtime: React Native + Expo (plantilla `blank-typescript`, sin Expo Router)
- Navegación: React Navigation (Stack + Tab), configurada a mano en `src/navigation`
- Backend / Base de datos: Firebase (Auth + Firestore) o Supabase — a definir antes de la Fase 3
- Persistencia local: AsyncStorage
- Tests: pendiente de definir (Jest es el estándar del ecosistema Expo/React Native)

## Comandos
- `npx expo start` — arranca el servidor de desarrollo en local
- `npx tsc --noEmit` — revisa que no haya errores de tipos (debe pasar antes de cada commit)
- `npx expo lint` — revisa el estilo del código (antes de cada PR)
- `eas build --platform android` — genera el build/APK para producción

## Estructura del proyecto
- `src/screens/` — pantallas de la app (Login, Home, Detalle, Carrito, Perfil, etc.)
- `src/components/` — componentes reutilizables (botones, cards, inputs)
- `src/navigation/` — configuración de Stack y Tab Navigator, y los tipos de navegación (`RootStackParamList`, `TabParamList`)
- `src/types/` — interfaces y tipos del dominio (`Negocio`, `Producto`, `Pedido`, `Usuario`, `EstadoPedido`)
- `src/services/` — llamadas a API/backend (`api.ts`), lógica de autenticación
- `src/assets/` — imágenes usadas dentro de las pantallas
- `assets/` (raíz) — recursos de la app en sí (ícono, splash screen)
- `App.tsx` — punto de entrada, envuelve la app en `NavigationContainer`
- `main.ts` — registra `App.tsx` como componente raíz (coincide con el campo `"main"` de `package.json`)

## Convenciones
- Nombres de archivos de pantallas en PascalCase y con sufijo `Screen`: `HomeScreen.tsx`, `DetalleScreen.tsx`.
- Variables y funciones en camelCase; interfaces y tipos en PascalCase.
- Todo estado de componente debe tiparse explícitamente: `useState<Negocio[]>([])`, nunca dejar que TypeScript infiera `any`.
- Los tipos del dominio viven únicamente en `src/types`; no se redefinen interfaces sueltas dentro de las pantallas.
- Toda llamada a la API pasa por `src/services/api.ts`; ninguna pantalla usa `fetch` o `axios` directamente.
- Validar todo dato de formulario (login, registro, checkout) antes de enviarlo o guardarlo.
- Datos leídos de AsyncStorage se validan con un chequeo de forma antes de usarse (no confiar ciegamente en `JSON.parse`).
- Errores de hardware (cámara, GPS, notificaciones) y de red se capturan siempre; ninguna pantalla puede crashear la app por un error no manejado.

## No hagas
- No instalar dependencias nuevas (especialmente librerías de navegación, backend o UI) sin avisar antes al equipo.
- No reintroducir Expo Router ni crear una carpeta `src/app/` — la navegación se configura a mano con React Navigation.
- No tocar `index.ts` ni el campo `"main"` de `package.json` por separado; deben coincidir siempre.
- No subir archivos `.env*`, credenciales de Firebase/Supabase, ni claves de API al repositorio.
- No usar `any` en TypeScript sin comentario explicando por qué es necesario.
- No mezclar datos hardcodeados con datos reales de la API en la misma pantalla una vez completada la Fase 2.
- No hacer push directo a la rama `master`; todo cambio pasa por una rama `feature/nombre` y su respectiva revisión.

## Flujo de trabajo
- Antes de una tarea no trivial (nueva pantalla, integración de hardware, cambio de arquitectura), propone un plan corto y espera el OK del equipo.
- Una tarea/issue a la vez; al terminarla, indica qué cambiaste exactamente para que el equipo lo revise antes de mergear a `master`.
- Si no estás seguro al 80% de cómo abordar algo (especialmente en Firebase/Supabase, permisos nativos, o tipos complejos), pregunta antes de improvisar código que luego haya que deshacer.
- Cada tarea terminada debe compilar sin errores (`npx tsc --noEmit`) antes de hacer commit.

## Documentación
- `README.md` — diario de implementación paso a paso, alineado a la rúbrica oficial de entregables (APF1, APF2, APF3, Proyecto Final).
- Issues de GitHub / tablero Kanban — desglose de tareas por fase, con criterios de aceptación específicos.
- Rúbrica oficial de entregables del curso — referencia de qué se evalúa en cada semana (5, 10, 15, 18).
- Syllabus del curso (Desarrollo de Aplicaciones Móviles) — temario semana a semana que define qué conceptos deben estar cubiertos en cada fase.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

