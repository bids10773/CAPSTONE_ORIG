# Clinical Form Drafts Implementation Plan

> For agentic workers: Use executing-plans to implement this plan task by task.

**Goal:** Save incomplete clinical work without completing or releasing it.
**Architecture:** Persist author-owned validated draft payloads separately from clinical records. Keep completion validation and workflow transitions intact.
**Tech Stack:** Laravel, SQLite, Inertia, React, TypeScript, Pest.
**Spec:** docs/superpowers/specs/2026-11-04-clinical-form-drafts-design.md

## Constraints and review focus

- Preserve user edits and current authorizations; draft saves must not create completed records or resolve rechecks.
- Blank findings start unselected; not assessed/applicable needs a reason at completion.
- Drafts must not leak between authors or appointments or bypass finalized-record locks.
- Validate entered values on draft saves; retain required completion fields and lab/X-ray verification.
- Restore partial data after reload and delete the author's draft only after successful completion.

## Tasks

- [x] Add failing feature tests for partial saves, restoration, isolation, invalid entered values, completion validation, and existing laboratory/X-ray draft behavior.
- [x] Add clinical draft model/migration and optional draft validation to the three existing requests.
- [x] Add authenticated save/load/clear behavior to existing controllers, preserving completion flow and locks.
- [x] Add draft buttons and restoration to the three forms; explicit physical assessment states and reasons.
- [x] Verify relevant feature tests, full PHP/frontend suites, TypeScript, lint and formatting; apply additive migration for local testing.

## Execution ledger

Ruling: work in the shared checkout to preserve and build on the user's uncommitted clinical changes; do not commit or move them.

Review: fixed browser recovery after in-place draft saves; browser persistence is only cleared on completion. Explicit unassessed vision/hearing must not reuse an old measurement. The existing legacy-intake regression test additionally requires preserving historical screening results when legacy intake has no explicit unassessed marker; both cases now pass together.

Final verification: 828 PHP tests pass (7,191 assertions), 49 frontend tests pass, TypeScript and scoped ESLint pass, Pint and Prettier pass, and the production Vite build succeeds. Applied only the two new additive migrations to the local database. No commits or changes to existing patient clinical records were made for this implementation.
