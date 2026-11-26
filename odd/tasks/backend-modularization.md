# Mercado Pago Backend Modularization

## Objective
Refactor the Mercado Pago backend from a single side-effectful entrypoint into focused configuration, middleware, payment, webhook, and route modules without changing observable behavior.

## Problem and rationale
`backend/src/index.ts` currently combines Express setup, Firebase Admin initialization, input/catalog validation, reservations, Mercado Pago requests, reconciliation, and route handlers. This makes critical payment invariants difficult to audit and maintain.

## Scope and constraints
- Authorized scope: `backend/src/**` and this task document only; do not modify app behavior, dependencies, environment files, Firebase data/rules, or deployment configuration.
- Preserve all existing route paths, HTTP outcomes and response shapes, checkout-return HTML, payment ID/idempotency derivation, reservation semantics, validation, ownership checks, signed webhook behavior, provider reconciliation, and secret/buyer-data logging restrictions.
- Strict ESM TypeScript; no `any`; no dependency installation.
- Do not upload, push, commit, deploy, seed, build an APK, inspect secrets, or perform live provider/Firebase writes.
- Chosen implementation route: delegated direct (assigned single-writer task); evidence: extraction spans multiple non-trivial modules and requires reading the existing payment lifecycle before editing.
- TDD/configuration status: no project TDD configuration was established in supplied context; exact validation commands are listed below and functional checks remain the project-defined commands.

## Tasks
- [x] BG-MOD-01 Extract runtime environment normalization and Firebase Admin singleton setup.
- [x] BG-MOD-02 Extract payment domain types, Firebase authentication middleware, validation/repository/provider/service logic, and webhook reconciliation/signature helpers.
- [x] BG-MOD-03 Extract payment, webhook, checkout-return, and health routes; `app.ts` composes/exports Express and `index.ts` only starts the listener.
- [x] BG-MOD-04 Run all requested backend and root checks and record observed results below.

## Acceptance criteria
- `backend/src/app.ts` assembles and exports the Express application only; `backend/src/index.ts` is a thin bootstrap that listens.
- Configuration, Firebase setup, payment types, auth middleware, services/utilities, and all route modules are meaningful modules rather than decorative empty files.
- Existing endpoint paths and externally observable route contracts are preserved.
- User/order ownership and reservation/reconciliation rules remain intact; no credentials or buyer data are logged.
- Backend typecheck, lint, build, root TypeScript, Expo lint, and `git diff --check` outcomes are recorded exactly.

## Progress and verification
- [x] Repository instructions, package scripts, current entrypoint, and prior payment-flow notes reviewed before source changes.
- [x] Backend `npm run typecheck` — passed.
- [x] Backend `npm run lint` — passed without warnings after removing an unused import.
- [x] Backend `npm run build` — passed.
- [x] Root `npx tsc --noEmit` — passed.
- [x] Root `npx expo lint` — passed.
- [x] Root `git diff --check` — passed; Git printed existing line-ending conversion warnings for unrelated modified files.
- [x] Preserved the existing payment lifecycle and response shapes; uncertain transport/provider responses and malformed successful responses are recorded as `review_required`, while only provider 400/401/403/422 releases reservations.
- External/live Mercado Pago, webhook round-trip, Firebase emulator/production, deployment, APK, and secret configuration checks are intentionally not performed.

## Next step
Complete BG-MOD-01 through BG-MOD-04, preserving unrelated existing worktree changes.
