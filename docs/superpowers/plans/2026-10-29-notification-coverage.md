# Notification Coverage and Role Interactions

**Goal:** Complete relevant operational notifications across admin, receptionist, doctor, medtech, radtech, patient, and company roles while preserving existing workflows and authorization.

**Architecture:** Database notifications reuse the existing private per-user realtime channel. A shared sender delivers after commit, filters inactive/duplicate recipients, isolates failures, and stamps the recipient role. Domain observers and explicit transition hooks supplement existing notifications rather than duplicating them. Clinical alert text contains operational status only, never findings, results, license proof, or free-text private reasons.

## Work

- [x] Shared safe notification sender and role-aware generic database notification; rollback, inactive, duplicate, failure-isolation tests.
- [x] Appointment, referral, bulk, walk-in, check-in/cancellation, availability decisions, and onsite assignment/task/attendance coverage.
- [x] License submission/decisions, staff changes, certificate lifecycle, clinical handoffs/finalization, and document release coverage.
- [x] Inquiry status/reply notifications to the owner and admin operational visibility.
- [x] Prompt bell and full-page refresh, realtime fallback, stale request handling, scoped read/delete/visit actions, safe authorized destinations.
- [x] Register observers; verify recipient matrix, privacy, no-op/rollback suppression, and existing notification counts.
- [x] Run full backend/frontend checks and review the final implementation.

Read-only views, downloads, routine synchronization, and unchanged saves do not create operational notifications. Existing password/security emails remain private. Admin visibility does not grant patient/company/clinical record permissions. Inactive accounts and unrelated companies or staff do not receive operational alerts.

## Review Focus

Role changes must not expose notifications from a former role. Appointment reassignment must not expose another physician's record. Patient notifications must not disclose unreleased clinical results. Bulk query updates must not bypass notification hooks. Broadcast or mail failures must not prevent committed business operations.

## Verification

On October 29, 2026, the full Laravel suite passed: 738 tests, 6,515 assertions. All 35 frontend tests passed; TypeScript, focused notification ESLint/Prettier checks, and PHP formatting passed. The independent review identified and closed missing social registration/profile completion, admin-created appointment, and company report review/release alerts. Regression tests cover those paths.

No real users were notified during verification. Live browser-to-Reverb connectivity was not verified; private channel routing and unavailable-broadcaster failure isolation were verified in tests, along with the refresh coordinator and notification page lifecycle. See `docs/notification-recipient-matrix.md` for the implemented recipient coverage.
