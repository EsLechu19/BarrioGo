# Inicio de sesión nativo con Google

## Objetivo
Permitir que un cliente inicie sesión con Google en Android y Firebase, preservando los perfiles ya existentes.

## Alcance autorizado
- Google funcional en `LoginScreen`.
- Apple únicamente visual, con aviso de próxima disponibilidad.
- Crear `users/{uid}` solo para cuentas Google nuevas y sin sobrescribir perfiles existentes.

## Restricciones
- No implementar Facebook.
- No generar APK, commit, push ni modificar Firebase Console.
- Usar el cliente web OAuth del `google-services.json` por variable de entorno local; la variable de EAS se configurará antes del APK.

## Tareas
- [x] GOOGLE-1 Configurar la integración nativa y el acceso Firebase.
- [x] GOOGLE-2 Crear perfil de cliente solo si no existe.
- [x] GOOGLE-3 Añadir botones Google y Apple visual en Login.
- [x] GOOGLE-4 Ejecutar TypeScript, lint y revisión de formato.
- [x] GOOGLE-5 Cerrar la sesión nativa de Google al cerrar sesión en BarrioGo.

## Verificación
- `npx tsc --noEmit`
- `npx expo lint`
- `git diff --check`

## Evidencia
- `npx tsc --noEmit`: correcto.
- `npx expo lint`: correcto.
- `git diff --check`: correcto; solo avisos CRLF de archivos ya modificados.
- Cierre Google: `npx tsc --noEmit`, `npx expo lint` y `git diff --check` correctos.

## Pendiente antes del APK
- Crear en EAS, ambiente `preview`, la variable `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` con el cliente web OAuth del proyecto. No guardar ni mostrar secretos.
