# Política de contraseñas

## Objetivo
Alinear el registro y el cambio de contraseña con la política activa de Firebase: mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.

## Alcance autorizado
- `src/utils/password.ts`
- `src/screens/RegisterScreen.tsx`
- `src/screens/MisDatosScreen.tsx`
- `src/context/AuthContext.tsx`

## Restricciones
- No endurecer el inicio de sesión: las cuentas antiguas pueden conservar su contraseña.
- No instalar dependencias, generar APK, hacer commit/push ni cambiar Firebase desde código.

## Tareas
- [x] PASS-1 Crear validación reutilizable de contraseña.
- [x] PASS-2 Aplicarla en registro y cambio de contraseña.
- [x] PASS-3 Traducir el rechazo de política de Firebase.
- [x] PASS-4 Ejecutar TypeScript, lint y revisión de formato.

## Verificación
- `npx tsc --noEmit`
- `npx expo lint`
- `git diff --check`

## Evidencia
- `npx tsc --noEmit`: correcto.
- `npx expo lint`: correcto.
- `git diff --check`: correcto; solo avisos CRLF de archivos ya modificados.
