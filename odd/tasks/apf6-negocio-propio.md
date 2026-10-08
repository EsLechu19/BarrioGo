# Feature: apf6-negocio-propio (F6 Negocio propio por cuenta)

## Objetivo
Cualquier usuario puede registrar SU propio negocio y queda vinculado como dueño (un negocio por cuenta). Sus pedidos y su menú pasan a operar sobre ese negocio.

## Slices
- [ ] S1 Registro + vínculo (ESTE): form + crea doc + `users/{uid}` `{rol:'negocio', negocioId}`.
- [x] S2 Mi local: editar info con chequeo de dueño en cliente (commit pendiente). Los 15 del seed quedan no editables (sin dueño).
- [x] S3 Icono + portada con Cloudinary Free ✔ verificado en físico (cuenta + preset unsigned + vars en .env; subida por base64 tras fixes XHR/REST/FormData). storage.rules queda para el futuro.
- [x] S4 Reglas: solo el dueño escribe su negocio/productos/pedidos-estado (commit pendiente; REQUIERE republicar en consola). Backfill: negocios/1 → dueño negocio@barriogo.pe.

## Alcance S1
- IN: `Negocio` con opcionales `descripcion`, `direccion`, `dueñoId`; `api.registrarNegocio`; pantalla `RegistrarNegocioScreen`; entrada desde Perfil; GPS opcional con fallback.
- OUT: edición posterior (S2), fotos (S3), rules de dueño (S4).

## Restricciones
- Todo Firestore por `api.ts`. Sin `any`. `tsc --noEmit` ok. Sin dependencias nuevas. Sin tocar rules (siguen abiertas a autenticados).
- GPS denegado → el registro sigue (lat/lng default Lima, editable en S2). Nunca crashear.

## Criterios S1
- Usuario sin negocio registra nombre+descripción+dirección → se crea `negocios/{id}` con `dueñoId=uid`, rating/opiniones en 0 → su `users` queda con rol negocio + negocioId → aparece tab Negocio con sus pedidos (vacío) y su menú (vacío, alta disponible).
- Si ya tiene negocioId → mensaje + atajo a Negocio, no duplica.
- Validación visible antes de enviar; errores de red visibles.

## Progreso
- 2026-10-07: doc creado. S1 implementado (writer) + fix parent `refreshRol` en AuthContext para que el tab Negocio aparezca sin re-login.
- Evidencia: `registrarNegocio` en api.ts, `RegistrarNegocioScreen` nueva, ruta en stack + botón en Perfil; `tsc --noEmit` pasa (exit 0, parent).
