# Mercado Pago Checkout Creation and Notification Fix

## Objective
Make sandbox checkout creation use a server-verified Firebase payer email, provide safe actionable failures, and notify businesses only after an official signed webhook confirms payment.

## Scope and constraints
- Route: delegated direct implementation; multiple non-trivial backend and mobile integration points require coordinated reads and writes.
- Preserve ownership validation, atomic payment reservation, idempotency, pending/retry/resume behavior, and existing immediate notifications for cash/Yape simulated methods.
- Do not expose/log Mercado Pago response bodies, credentials, tokens, or buyer data; never accept payer email as arbitrary client input.
- No dependency installation, remote provider/Firebase access, secrets inspection, seed, build/APK, deploy, commit, or push.
- No restructuring outside the payment request, checkout error contract, order notification trigger, and this task document.

## Tasks
- [x] MPF-01 Read the existing Firestore order/payment lifecycle and notification contracts; identify safe user-message flow.
- [x] MPF-02 Resolve verified payer email from Firebase auth context and include it in the Checkout Pro Orders request; preserve order ownership checks.
- [x] MPF-03 Make checkout failures actionable while keeping provider and personal data out of responses and logs; preserve reservation/retry/resume semantics.
- [x] MPF-04 Defer business "Pedido recibido" notification for Mercado Pago sandbox until official paid webhook reconciliation; preserve immediate cash/Yape simulated notifications.
- [x] MPF-05 Run requested static checks and record exact results plus external tests still pending.

## Acceptance criteria
- Only a Firebase-verified email obtained server-side can be sent to Mercado Pago; client-provided email is ignored.
- A failed checkout shows a user-safe next step, and neither provider response bodies nor secrets/PII are returned or logged.
- For `mercadopago_sandbox`, the business notification fires only after webhook reconciliation marks the payment paid; simulated cash/Yape timing is unchanged.
- Provider creation rejection releases only the current reservation safely; ambiguous/malformed outcomes remain review-required; retry/resume behavior is not weakened.
- No order/payment is duplicated, incorrectly cleared, or left malformed after a checkout creation failure.
- Requested typecheck/lint/build and diff checks are reported honestly; no live Mercado Pago behavior is claimed.

## Progress and evidence
- Explored `backend/src/payments/{paymentService,orderValidation,paymentRepository,webhookService,mercadoPagoClient}.ts`, payment routes/auth types, `src/screens/CarritoScreen.tsx`, and notification service contracts. Confirmed backend verifies Firebase ID tokens but currently retains only UID; Mercado Pago orders omit `payer.email`; checkout failures currently return generic errors; Carrito's business bridge observes newly-created Firestore orders.
- Prior lifecycle evidence: pending orders are reserved in a deterministic aggregate payment; definitive provider 400/401/403/422 rejection releases reservation and records `creation_failed`; transport/malformed uncertainty is `review_required`; pending checkout resumes by existing URL; only official order reconciliation updates paid state.
- Added a server-side verified-email eligibility check before Carrito persists orders, then supplies the signed Firebase token's verified email claim to the Orders request; the client cannot submit the payer email.
- Added allowlisted error-code mapping to safe user guidance. Provider error bodies are not parsed or logged; unknown backend and network failures use fixed generic text. Definitive rejection remains retryable by the existing same-order reservation lifecycle; transport/malformed responses remain `review_required`.
- Updated the business notification bridge to track payment state and emit Mercado Pago's new-order notification only on transition to `pagado`; cash/Yape keep their immediate new-order behavior.
- Backend `npm run typecheck`, `npm run lint`, and `npm run build`: passed. Root `npx tsc --noEmit`, `npx expo lint`, and `git diff --check`: passed (Git emitted only LF-to-CRLF working-copy warnings).
- No live Mercado Pago checkout/webhook, Firebase emulator/live call, deployment, APK, seed, or secret configuration check was performed. External sandbox test remains pending.

## Checks
- Backend: `npm run typecheck`, `npm run lint`, `npm run build`.
- App: `npx tsc --noEmit`, `npx expo lint`.
- Repository: `git diff --check`.
- External validation intentionally not run: Mercado Pago sandbox checkout/webhook, Firebase emulator/live calls, deployment, APK/build, or secrets/configuration.

## Next step
Configure sandbox credentials and webhook only in the authorized environment, then verify a real sandbox checkout and signed paid webhook; neither was tested in this local correction.
