# Mercado Pago Sandbox

## Objective
Add a sandbox-only Mercado Pago Checkout Pro Orders flow that confirms the existing per-business Firestore orders after one aggregated test payment.

## Scope and constraints
- Route: delegated direct implementation (multiple non-trivial backend and app files).
- Preserve the existing simulated payment methods.
- No production credentials, Render deployment, Firebase deployment, APK build, seed, commit, or push.
- Never expose provider or Firebase Admin secrets in app code, logs, Git, or documentation.
- Configure the test-mode Mercado Pago Webhook URL and Orders v2 topic in the provider dashboard; the backend does not send an undocumented `notification_url` property.

## Tasks
- [x] MP-01 Create a backend-only sandbox service with authenticated aggregate-order creation and verified webhook handling.
- [x] MP-02 Link one aggregate payment record to the existing per-business `pedidos` documents safely and idempotently.
- [x] MP-03 Add the app-side Mercado Pago test checkout and deep-link return state without breaking simulated payment methods.
- [x] MP-04 Add minimal Firestore-rule changes required to prevent client writes to trusted sandbox-payment records; do not deploy rules.
- [ ] MP-05 Run applicable type/lint checks and document untested external/deployment steps.

## Acceptance criteria
- A client can initiate a sandbox checkout only for their own pending orders.
- Provider secrets stay backend-only.
- A verified webhook is the only path that marks Mercado Pago sandbox orders as paid.
- Pending orders are reserved atomically by one aggregate payment; clients cannot cancel or advance a reserved order, and webhook settlement revalidates every reservation.
- Owners can reopen a pending payment's existing Checkout URL from its status screen.
- One confirmed sandbox payment updates every linked per-business order, so each dashboard retains its own revenue totals.
- Existing mock payments still work.

## Progress
Implemented MP-01 through MP-04, including atomic reservations, release on definitive provider rejection, transactional webhook revalidation, owner-only checkout recovery, and top-level Expo deep-link scheme. Root TypeScript/lint results are pending this correction pass. Backend dependencies are not installed, so backend checks remain pending. No live Mercado Pago call, webhook signature round-trip, Firestore emulator check, deployment, commit, push, or APK build was performed. Test-mode Webhook dashboard configuration is still required; the app/backend URL and sandbox credential values remain placeholders. Engram mirror remains pending because no authoritative session identity was supplied.
