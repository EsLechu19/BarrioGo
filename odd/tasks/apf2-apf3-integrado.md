# Integración APF2 UI + APF3 funcionalidad

## Objetivo

Conservar el diseño visual, navegación y componentes de `feature/apf2-ui-unido`, incorporando la lógica funcional y los servicios remotos de `feature/apf3-firebase-base`.

## Alcance autorizado

- Rama de trabajo: `feature/apf2-apf3-integrado`.
- Fuente visual: `feature/apf2-ui-unido`.
- Fuente funcional: `feature/apf3-firebase-base`.
- No modificar las ramas originales.
- No incluir secretos de `.env` ni `service-account.json`.

## Tareas

- [x] T1. Consolidar servicios Firebase, API, ubicación, notificaciones, reglas y scripts de APF3 sin perder el fallback y los indicadores de origen de APF2.
- [x] T2. Consolidar contextos, tipos y Hooks manteniendo el diseño de datos requerido por la UI APF2.
- [x] T3. Integrar la lógica de autenticación, catálogo, detalle, carrito, favoritos, pedidos y panel negocio en las pantallas visuales APF2.
- [ ] T4. Verificar navegación, tipos, compilación y flujos funcionales en Expo.

## Criterios de aceptación

- La aplicación conserva las pantallas, estilos, componentes y rutas de APF2.
- Firebase Auth y Firestore funcionan cuando las variables de entorno están configuradas.
- El catálogo conserva el orden de fuentes Firestore → API local → JSON local.
- Carrito, favoritos, GPS, pedidos y panel negocio conservan su lógica funcional.
- `npx tsc --noEmit` pasa sin errores.
- No se versionan secretos ni artefactos locales.

## Progreso

- Rama de integración creada desde APF2.
- Comparación de ramas completada.
- Servicios APF3 y pantallas APF2 reconciliados en la rama de integración.
- Verificación estática completada; la ejecución visual de Expo queda pendiente por no iniciar un runtime interactivo en esta sesión.
- El carrito conserva `nombre`, persiste con AsyncStorage y ahora guarda también `negocioId` para pedidos con productos de Firestore; los carritos antiguos mantienen compatibilidad con el catálogo local.

## Verificación

- TypeScript: `npx tsc --noEmit` pasa.
- Static check: `git diff --check` y `node --check scripts/mock-server.js` pasan.
- Expo lint: falla por 10 errores `react-hooks/set-state-in-effect` y 6 advertencias ya presentes en la integración; no se usó como criterio de compilación.
- Ejecución Expo: no ejecutada en esta verificación acotada.
- Firebase runtime: no verificado; depende del `.env` local y no se leyeron ni documentaron secretos.

## Próximo paso

Revisar visualmente los flujos en Expo con un `.env` configurado y validar Auth, Firestore, permisos GPS/notificaciones y Cloudinary en dispositivo o emulador.
