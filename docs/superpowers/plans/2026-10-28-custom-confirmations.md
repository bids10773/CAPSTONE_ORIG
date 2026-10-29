# Custom Confirmation Dialogs Plan

**Goal:** Replace every native browser confirmation and accompanying text prompt with UI-consistent modal dialogs, preserving messages, Confirm/Cancel results, request payloads, routes, and role permissions.

**Design:** A shared asynchronous dialog controller and one root-mounted Radix dialog host. Confirm resolves true/false; prompt resolves string/null (including an intentionally empty string). Ignore duplicate requests while a dialog is active. Identify each request so stale dismissal events cannot cancel a later dialog. Navigation clears pending dialogs. Preserve the document-release recipient question's original false-to-patient branch and optional remarks behavior, with an explicit navigation-session check before proceeding. Existing custom modals remain unchanged. Console confirmations are not browser dialogs.

**UI:** Use existing Dialog, Button, Input, clinic palette, typography, and focus styles; retain complete multiline messages. Support keyboard submission, Escape, Cancel, close, and backdrop dismissal with cancellation semantics.

- [x] Add failing controller and representative workflow tests, plus an audit of native browser calls.
- [x] Implement the shared controller and root modal host.
- [x] Convert all native browser call sites to awaited modal results, retaining messages and request logic.
- [x] Verify cancellation, duplicate protection, sequential prompts, and navigation cleanup.
- [x] Run frontend tests, TypeScript, lint, relevant workflow tests, and production build; audit for remaining native dialogs.

Audit: 19 confirmations and 6 prompts migrated across 16 pages. AST comparison verified all 25 original message expressions and arguments and checked every call is awaited. No native browser dialog calls remain in resources/js or resources/views.

Review: corrected an Inertia Link whose default navigation needed synchronous prevention, and added focus restoration that survives sequential prompts without stealing focus after navigation. Follow-up review found no remaining blockers. Regression tests reproduce both cases before their fixes.

Validation: 32 frontend tests, 71 relevant PHP workflow tests, TypeScript, targeted ESLint, Prettier, diff checks, and the final production build pass.
