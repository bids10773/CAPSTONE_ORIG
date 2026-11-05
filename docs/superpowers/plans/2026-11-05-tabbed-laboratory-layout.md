# Tabbed Laboratory Layout Implementation Plan

> For agentic workers: use executing-plans for inline implementation.

**Goal:** Compact, reversible laboratory tabs with always-visible save/finalize controls.
**Architecture:** Keep the existing form and all mounted panels. Add layout preference, accessible tabs, compact field styling and an action bar. Original layout reuses the existing all-sections styles.
**Tech stack:** React, Inertia, Tailwind, TypeScript, Node tests.
**Spec:** docs/superpowers/specs/2026-11-05-tabbed-laboratory-layout.md

## Constraints and review focus

- Tab and layout changes must preserve values and all-service submission.
- Errors on hidden panels must be visible through tab selection and badges.
- Arrow/Home/End navigation and Enter-to-next-input must skip hidden fields.
- Small viewports and long abnormal findings must remain reachable.
- Locked/verification-only reports retain existing controls and restrictions.

## Tasks

- [x] Back up the exact current form under storage/app/ui-backups.
- [x] Add behavioral frontend tests for tabs, value retention, restoration and validation across tabs.
- [x] Update resources/js/pages/medtech/lab-results-form.tsx with the two layouts, accessible tabs and fixed actions.
- [x] Verify tests, TypeScript, lint, production build, and desktop/mobile previews.
- [x] Record the backup path and Original layout control for rollback.

## Execution notes

Work in place to preserve the user's existing uncommitted changes. Do not commit or reset the workspace. No backend or PDF changes.

Backup: `storage/app/ui-backups/lab-results-form-before-tabs-20261105-004725.tsx` is the exact pre-task source. The Original layout button is the immediate rollback option; it does not change entered results. For a full source rollback, restore that backup to `resources/js/pages/medtech/lab-results-form.tsx` and rebuild; this restores the file as it was before this task.

Review corrections: remarks expansion is independent of content, so deleting a note does not collapse the editor. The fixed action bar is measured with ResizeObserver so its reserved space follows wrapped actions and errors. Layout preference uses useSyncExternalStore to preserve server rendering and tolerate unavailable storage.

Visual verification: headless Edge previews using synthetic patient data, current server field definitions, and production CSS. At 1440x900, every visible clinical input and interpretation control fits above the action bar for CBC, urinalysis and fecalysis. At 1366x768, urinalysis requires some vertical scrolling. At 390x844 there is no horizontal overflow and the action bar remains visible. Screenshots are under `storage/app/lab-layout-preview/`. These are isolated UI previews, not an authenticated end-to-end browser session.

Behavior verification: all 60 frontend tests pass, including tab/layout value retention, preference restoration, client/server error navigation, keyboard tab navigation, clearing remarks, successful all-tab finalization, blocked storage, locked reports and Drug Test verification controls. TypeScript, scoped ESLint and Prettier pass. The final production build succeeds.
