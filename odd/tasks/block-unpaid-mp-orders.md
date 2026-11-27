# Block unpaid Mercado Pago sandbox orders

## Objective
Prevent business owners from advancing or rejecting a Mercado Pago sandbox order until its payment is confirmed, while keeping the unpaid order visible and preserving all non-Mercado-Pago behavior.

## Problem and rationale
Unpaid sandbox orders can be visible in the business panel with active processing actions. The owner UI, client-side service guards, and Firestore rules must all enforce the payment confirmation boundary; payment state remains server-owned.

## Scope and constraints
- Scope: business order list actions, order state service guards, and Firestore update rules for `mercadopago_sandbox` orders.
- Preserve every cash, Yape, and simulated card path unchanged.
- Do not change payment creation, checkout, notifications, maps, login, or unrelated flows.
- No new dependencies; no Render/Firebase remote operations, APK, seed, external deployment, commit, or push.
- Keep the unpaid order visible and show `Esperando confirmación de pago`.
- No client path may allow spoofing `estadoPago`.

## Route and reason
Delegated direct writer route: this fix spans multiple non-trivial layers (owner UI, service, Firestore rules); writing inline would cross the mandatory multi-file writer threshold. Exploration was handled within this bounded writer assignment.

## TDD and verification
- TDD mode: unknown / not configured in project instructions; project documentation says tests are pending definition.
- Test runner: none configured for this change.
- Required checks: `npx tsc --noEmit`, `npx expo lint`, `git diff --check`.
- Firestore rules must be syntax-inspected only; do not deploy.

## Acceptance criteria
- [x] Unpaid Mercado Pago sandbox orders remain visible to the owner with `Esperando confirmación de pago`.
- [x] Confirmation/preparation/shipping progression and business rejection are unavailable in UI for any unpaid Mercado Pago sandbox order; the waiting message is limited to orders with both `estado === 'pendiente'` and `estadoPago === 'pendiente'`.
- [x] Client service methods reject attempts by the business to advance or reject unpaid Mercado Pago sandbox orders.
- [x] Firestore rules reject owner state advancement and rejection for unpaid Mercado Pago sandbox orders while keeping payment state server-owned.
- [x] Cash/Yape/simulated card behavior is unchanged (guards apply only to `mercadopago_sandbox`).
- [x] Required static checks passed; Firestore rules were syntax-inspected without deployment.
- [x] Failed or cancelled Mercado Pago orders retain their truthful existing order status; unpaid orders have no business processing actions.

## Tasks
- [x] T1 — Guard owner order UI actions and show the unpaid-payment status.
- [x] T2 — Guard business order state service methods and Firestore owner transitions.
- [x] T3 — Run required static checks, inspect Firestore rules syntax, and record results.
- [x] T4 — Narrow the UI wait-state gate to orders whose business state and payment state are both pending; rerun required static checks.
- [x] T5 — Hide business processing actions for every unpaid Mercado Pago order while preserving order-status rendering; rerun required static checks.

## Verification evidence
- `npx tsc --noEmit` — passed (exit 0).
- `npx expo lint` — passed (exit 0).
- `git diff --check` — passed (exit 0).
- `firestore.rules` — manually inspected the modified predicates and grouping for owner transition and rejection; balanced conditions require `estadoPago == 'pagado'` only for sandbox MP orders. No local Firebase CLI was available, so no compiler/emulator check was run; rules were not deployed.
- No tests or builds run; no test runner is configured for this feature.
- No commit or push created; parent will handle the commit after review.
- The wait-state UI now matches only sandbox Mercado Pago orders with `estado === 'pendiente'` and `estadoPago === 'pendiente'`. Failed-payment and cancelled orders retain their prior truthful status/actions; the service and Firestore guards remain unchanged and continue blocking any unpaid business update.
- Reverification after T4: `npx tsc --noEmit`, `npx expo lint`, and `git diff --check` all passed (exit 0).
- Follow-up review identified that failed-payment orders should keep the normal order status but must still have processing buttons hidden. The UI now uses separate predicates: the waiting message requires pending order and payment states, while all unpaid Mercado Pago orders suppress processing actions.
- Reverification after T5: `npx tsc --noEmit`, `npx expo lint`, and `git diff --check` all passed (exit 0).

## Progress and next step
Implementation is complete in `src/components/negocio/Pedidos.tsx`, `src/services/api.ts`, and `firestore.rules`. Parent should review and commit the local changes; no remote or Firebase operation is authorized.
