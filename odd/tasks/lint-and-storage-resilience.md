# Limpieza de lint y aviso de persistencia local

## Objetivo
Eliminar los warnings existentes de lint y avisar una sola vez al usuario si AsyncStorage no puede guardar datos.

## Alcance autorizado
- `src/context/AuthContext.tsx`
- `src/services/firebase.ts`
- `src/services/storage.ts`

## Restricciones
- No instalar dependencias ni crear pruebas automatizadas.
- No modificar pagos, Firebase remoto, reglas, servidor, app.json, commit, push ni APK.

## Tareas
- [x] QUALITY-1 Corregir dependencias de useMemo en AuthContext. Evidence: callbacks estables y dependencias completas.
- [x] QUALITY-2 Unificar imports de Firebase Auth sin ocultar incompatibilidades de tipos. Evidence: un solo import de `firebase/auth` conserva el `@ts-expect-error` específico.
- [x] QUALITY-3 Mostrar un aviso único y no bloqueante cuando falle una escritura o eliminación de AsyncStorage. Evidence: `avisarFalloPersistencia` con alerta única.
- [x] QUALITY-4 Ejecutar TypeScript, lint y diff check. Evidence: los tres comandos terminaron con código 0.

## Criterios de aceptación
- Expo lint sin warnings.
- La app no crashea ante fallo de AsyncStorage y el usuario recibe un aviso una vez.

## Estado
- No se instalaron dependencias ni se agregaron pruebas automatizadas.
- No se realizó commit, push ni build.
