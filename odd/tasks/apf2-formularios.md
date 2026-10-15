# Feature: apf2-formularios

## Objetivo
Formulario funcional al 100% (rúbrica APF2 25%): reglas de longitud y coincidencia + trim.

## Cambios
- Register: nombre ≥3, email estricto, password ≥6, confirmPassword obligatoria e igual; error visible en su campo (antes ni se validaba).
- Login: email trim + password ≥6.
- Sesión guarda nombre/email trimmeados.

## Checklist
- [x] Reglas + mensajes por campo
- [x] `tsc` OK

## Evidencia
- Rama `feature/apf2-formularios`: `eb66ef6 feat(auth)`
- Cadena APF2 completa: 12 commits desde `4cb83d0` hasta `eb66ef6` (ver `git log`)
