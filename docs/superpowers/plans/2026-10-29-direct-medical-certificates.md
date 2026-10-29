# Direct Medical Certificate Appointments

**Goal:** Open medical certificate appointments in the existing certificate editor without requiring physical examination or final evaluation. Keep final evaluation for pre-employment and annual examinations, as clarified by the user; retain compatibility for older appointments without a recorded purpose.

**Architecture:** Route the assigned doctor from the queue into the existing create/edit certificate pages. Redirect older examination links for certificate appointments to the same pages. Complete linked certificate appointments only on issuance. Keep permissions, approval, and issuance checks.

**Tech stack:** Laravel, Inertia, React, Pest.

- [x] Add regression tests for direct entry, existing drafts, assignment checks, final-evaluation exclusion, and issuance completion.
- [x] Add a purpose check and certificate entry URL to the doctor queue; redirect legacy examination links after authorization.
- [x] Prevent certificate appointments from entering final evaluation and complete them on certificate issuance.
- [x] Verify certificate workflow tests, relevant examination tests, frontend lint and formatting; review the diff.

Review focus: unauthorized doctors, existing certificates, drafts leaving appointments open, historical final-evaluation links, and unchanged pre-employment workflows.

The user clarified that annual examinations also keep final evaluation. The temporary annual-completion changes were removed. Both annual and pre-employment final evaluation are covered by regression tests.

Independent review found no additional certificate-flow issues. Its annual-release concern was resolved by preserving the existing annual final-evaluation and release workflow.

Validation: 650 backend tests passed (6,124 assertions); 32 frontend tests passed; TypeScript, targeted ESLint, Prettier, Pint, and git diff whitespace checks passed.
