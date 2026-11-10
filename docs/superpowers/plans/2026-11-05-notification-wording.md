# Notification wording implementation plan

> **For agentic workers:** Use subagent-driven-development for the independent source groups and review the combined change. Track completion below.

**Goal:** Make all new notifications identify the real action, responsible actor, and affected person or record consistently.

**Architecture:** A small `App\Support\NotificationWording` formatter supplies role labels, actor suffixes, record references, and schedules. Complete sentences remain event-specific at notification producers. Capture actor strings before deferred delivery; neutral wording is required when the actor is unknown.

**Tech stack:** Laravel, PHP, Pest; existing database/mail channels.

**Spec:** `docs/superpowers/specs/2026-11-05-notification-wording-design.md`

## Global constraints

- Preserve types, recipients, authorization, channels, links, notification counts, timing, and company isolation.
- Use name and role for known actors, `you/your` for the recipient, real record references, sentence-case titles, and action-specific verbs.
- Automated does not mean unknown: label only confirmed automatic events as performed by the system.
- No clinical findings, secrets, tokens, private review notes, or representative details in expanded notification audiences.
- No schema change, historical rewrite, unsolicited commit, or push.
- Continue in the user's existing workspace with the approved in-progress license changes preserved.

## Review focus

- Old `processed_by`/`assigned_by` values must not identify an earlier actor as the actor of a later action.
- Deferred messages must retain the event actor when authentication changes before delivery.
- Missing/deleted related users and missing appointment times must yield grammatical neutral messages.
- Clinical drafts, finalized results, handoffs, ready-for-pickup, and actual release must remain distinct.
- Exact-message test updates must preserve privacy and recipient/count assertions.

### Task 1: Shared wording formatter

**Files:** Create `app/Support/NotificationWording.php`, `tests/Feature/NotificationWordingTest.php`.

**Interfaces:** Static `role(string): string`; `actor(User|int|null): ?string`; `by(User|int|null): string` returns empty string or ` by Name (Role)`; `person(?User, string $fallback = 'the affected user'): string`; `appointment(Appointment): string` returns `appointment APTxxxx`; `schedule(Appointment): string`; `status(string): string` expands internal workflow labels.

- [x] Add failing tests for named actors, unknown actors, role labels, appointment context, missing times, and clinical status distinctions.
- [x] Run the test and confirm a missing-class failure; implement the formatter; rerun until passing.

### Task 2: Dedicated notifications

**Files:** `app/Notifications/*.php`, only producer call sites needed to capture optional notification context; new `tests/Feature/NotificationMessageWordingTest.php`.

**Interfaces:** Consume `NotificationWording`. Optional constructor context must preserve existing callers. Own all dedicated notification classes; coordinate call-site changes with Task 4.

- [x] Test verified actors, system expiry, absent identity/time, and medical report handoff semantics before implementation.
- [x] Revise dedicated titles/messages and corresponding email text while preserving routing/channels/reasons.
- [x] Snapshot actor text at construction for notifications sent later. Never infer later event actors from creation/earlier review fields.
- [x] Run focused notification tests and report exact source coverage and any required parent call-site changes.

### Task 3: Observer-produced notifications

**Files:** All 11 `app/Observers/*NotificationObserver.php` and `*WorkflowObserver.php`; new `tests/Feature/ObserverNotificationWordingTest.php`; existing exact-message expectations in clinical notification tests as needed.

**Interfaces:** Consume formatter; preserve recipient logic exactly. Audit actor fields take precedence over authenticated actor; authenticated actors may identify synchronous model actions. Use only action-specific fallback fields. Own observer source files and observer-specific tests.

- [x] Test actor/target distinction for license events, action-specific clinical verbs, certificate stages, appointment status changes, and automatic queue assignment.
- [x] Rewrite each event's title/body with proper name/role/record context; missing actor gets neutral wording.
- [x] Run focused observer and notification-recipient tests; report coverage and cross-group concerns.

### Task 4: Direct producers and transactional emails

**Files:** Notification-producing controllers/services/actions; `app/Mail/*`; `resources/views/email/*`; authentication notification configuration in providers. Tests: new `tests/Feature/DirectNotificationWordingTest.php` and existing affected tests.

**Interfaces:** Formatter; optional dedicated-notification constructor context from Task 2. Root owns all non-observer producers and email templates to avoid file collisions.

- [x] Audit all direct producers and message-bearing email templates; add focused failing tests for misleading actions, actor/target distinctions, and safe fallbacks.
- [x] Revise remaining prose and pass reliable action context into dedicated notifications. Preserve all workflow behavior.
- [x] Ensure emails describe what actually happened, particularly account invitations, reset requests, clinical handoffs, and inquiry responses.

### Task 5: Coverage, integration, and review

**Files:** Create `docs/notification-wording-coverage.md`; update this plan's execution record.

- [x] Record every notification class, observer, direct producer, and email template, including reviewed-and-retained text.
- [x] Run focused suites, fix exact-message assertions only where expected wording changed, then run the PHP suite and Pint on changed PHP files.
- [x] Request an independent combined review for attribution, clinical semantics, privacy, and coverage; address important findings and rerun affected tests.
- [x] Report completed behavior and actual verification; leave code uncommitted.

## Execution record

- User approved design and selected names with roles plus shared formatter.
- Ruling: continue in the existing checkout rather than create a separate worktree: this is a continuation of the user's approved in-place changes and the spec explicitly preserves them. No Git mutations are needed.
- Initial worktree changes: StaffController redirect, StaffSecurityNotificationObserver wording, ProfessionalLicenseVerificationTest redirect assertion, and design document.

- Completed shared formatter, all dedicated notification classes, all 11 observer producers, direct producers, and transactional email review.
- Task 2 verification: 89 tests / 797 assertions; Task 3 initial verification: 49 tests / 181 assertions.
- Review fixes: mark automatic expiry, cancellation, replacement scheduling, referral propagation, invitation expiry, and failed delivery explicitly as system actions; keep context temporary and restore it after each update.
- Review fixes: preserve release-reversal semantics and manual certificate void/submission/correction/issuance actors without reusing an earlier approver.
- Ruling: use separate clinical service labels for queue tasks (physical examination, laboratory, X-ray, drug test verification, final evaluation), rather than staff role labels; preserves the actual task being assigned.
- Full PHP suite passed: 891 tests, 7496 assertions. Final source-action and actor-fallback regressions were additionally verified in focused suites: 58 tests / 254 assertions and 35 tests / 180 assertions.
- Initial full-suite failures were corrected: handoff wording expectation now matches reception preparation; the older cancellation notification-count test now supplies the cancellation reason already required by the previous feature. Recipient, count, privacy, and permission assertions remain intact.
- Independent review: no remaining Important defects after fixes. No schema changes, real notification sends, commits, or pushes.
