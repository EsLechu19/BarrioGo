# Pre-push hardening

## Objective
Close the concrete client-side safety and configuration findings from the read-only pre-push audit without uploading, deploying, seeding, building an APK, or changing unrelated work.

## Problem and why
The audit found malformed Spanish permission copy, unsafe distance calculations for businesses without valid coordinates, an undocumented public Google web client ID, and a Mercado Pago retry path that can strand pending orders.

## Scope
- Repair only the two mojibake permission strings in `app.json`; retain `expo.scheme: "barriogo"` and unrelated configuration.
- Guard Haversine calculations in Home, Restaurants, and Favorites so invalid business coordinates yield an empty `distancia` and do not participate in distance sorting.
- Add a harmless placeholder and neutral description for `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env.example`.
- Reuse existing pending Mercado Pago orders and offer a safe retry/resume path from order details; preserve simulated payment methods.

## Authorized scope
- `app.json`, `.env.example`
- `src/screens/HomeScreen.tsx`, `src/screens/RestaurantsScreen.tsx`, `src/screens/FavoritosScreen.tsx`
- `src/screens/PedidoDetalleScreen.tsx`, `src/services/mercadoPago.ts`, `backend/src/index.ts`
- `odd/tasks/prepush-hardening.md` and its Engram mirror

## Constraints
- No new dependencies, credentials, secret environment reads, external network calls, Firebase/Firestore writes, seed, APK build, deploy, staging, commit, or push.
- Preserve all unrelated working-tree edits and existing top-level Expo configuration.
- No source edits outside the named scope.

## Route and delegation rationale
- Substantial, bounded delegated-direct implementation: multiple independent audit findings across client configuration, three list screens, and the existing payment client/backend flow. The parent delegated a single writer; further writer delegation is unnecessary.
- No SDD workflow selected. The work is implementation of concrete, already-scoped audit findings.

## Tasks and acceptance criteria
- [x] T1 — Restored valid UTF-8 Spanish text in the camera and location permission descriptions; preserved `expo.scheme: "barriogo"` and unrelated config.
- [x] T2 — Validate business latitude/longitude as finite values in range before Haversine; invalid inputs and non-finite results keep `distancia: ''` and are placed after calculable distances without NaN comparators.
- [x] T3 — Documented `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` with a harmless sample and neutral note; no `.env` values were read or emitted.
- [x] T4 — Added an authenticated lookup by order ID for its existing pending payment, validating user/order/payment association and pending checkout state; order detail resumes that payment instead of creating another order. Simulated retry remains unchanged, and Mercado Pago failures no longer trigger simulated retry.
- [x] T5 — Ran the requested checks; outcomes are recorded below.

## Checks
- `npx tsc --noEmit`
- `npx expo lint`
- `cd backend; npm run typecheck`
- `cd backend; npm run build`
- `git diff --check`

## Progress
- [x] Audit scope and constraints received; existing user edits inventoried before writes.
- [x] T1–T4 implemented within authorized paths; existing unrelated edits preserved.
- [x] `npx tsc --noEmit` — passed.
- [x] `npx expo lint` — passed (Expo printed variable names loaded from `.env`, not their values).
- [x] `cd backend; npm run typecheck` — passed.
- [x] `cd backend; npm run build` — passed.
- [x] `git diff --check` — passed; Git emitted line-ending normalization warnings only.

## Accepted implementation rationale
- Resolving the active payment from one order ID is necessary because the stored checkout can cover multiple business-grouped orders; a detail screen cannot safely reconstruct that group. The backend returns only an authenticated user's existing pending payment and does not create or mutate payment/order data on resume.

## Next step
Review the changed files locally. No staging, commit, push, deploy, seed, Firebase writes, or APK build was performed.
