# Security Review — 2026-08-09

## Scope and current architecture

The application uses Laravel Fortify authentication, email verification, login and 2FA throttling, optional 2FA, active-account and temporary-password middleware, role-prefixed route groups, appointment/company policies, Form Requests for clinical actions and imports, Eloquent/query-builder parameter binding, CSRF-protected web routes, private local storage for Drug Test evidence, and database-backed clinical/security audit models.

Existing controls were retained. No destructive migration, route rename, authentication replacement, package installation, or UI redesign was performed.

## Critical

### Fixed default staff credential in a tracked utility

- Vulnerability: A repository-tracked script created a predictable account using a fixed email and password, printed the credential, used a non-existent `staff` role, and deleted an existing account with the same email.
- Location: `create_infostaff.php`
- Risk: Immediate unauthorized staff access if executed; destructive account replacement; bypass of the temporary-credential workflow.
- Recommended fix: Use only the authenticated Admin Staff workflow and its expiring random credentials and audit records.
- Changes implemented: Disabled the legacy script with a fail-closed message. The supported staff workflow remains unchanged.
- Testing performed: PHP formatting checks and the full Laravel test suite.

### Premature disclosure of official diagnostic results

- Vulnerability: An owning patient could download a non-PE Drug Test or X-ray PDF while its official result was still awaiting doctor verification.
- Locations: `app/Http/Controllers/LaboratoryController.php`, `app/Http/Controllers/ClinicalDocumentController.php`
- Risk: Disclosure of preliminary or unverified medical findings as though they were official.
- Recommended fix: Enforce verification/release state in the download controller after ownership authorization.
- Changes implemented: Non-PE Drug Test downloads require a verified diagnostic result; non-PE X-ray downloads require a verified X-ray report. PE documents continue to use the existing explicit final-report release gate.
- Testing performed: Added direct download tests for unverified Drug Test and X-ray results and reran the complete suite.

## High

### Inconsistent record-level appointment authorization

- Vulnerability: Appointment detail ownership was enforced inline in a controller rather than through the existing policy architecture.
- Locations: `app/Http/Controllers/AppointmentController.php`, `app/Policies/AppointmentPolicy.php`
- Risk: Future appointment endpoints could implement different ownership rules and reintroduce IDOR.
- Recommended fix: Centralize record-level access in `AppointmentPolicy` and invoke it before loading sensitive relations.
- Changes implemented: Added the `view` policy and replaced the inline condition with `Gate::authorize('view', $appointment)`.
- Testing performed: Added a patient-to-other-patient appointment and clinical-document ID manipulation test.

### Status transitions are not centrally constrained

- Vulnerability: The admin status endpoint validates membership in a status list but does not enforce a transition graph.
- Location: `app/Http/Controllers/AppointmentController.php::updateStatus`
- Risk: A privileged user or compromised admin session can skip required workflow stages; behavior is split between controllers and services.
- Recommended fix: Introduce a transition service/policy with per-role allowed transitions, readiness guards, transactions, and audit events.
- Changes implemented: Not changed in this pass because existing bulk, walk-in, and clinical services have distinct transition behavior that must be mapped before centralization.
- Testing performed: Existing workflow tests were reviewed; transition-specific negative tests remain required.

### Audit trail is incomplete and has no admin review page

- Vulnerability: `SecurityAudit` covers several onboarding/import/scheduling events and `ClinicalFormAudit` covers clinical changes/downloads, but login/logout, failed login, generic appointment changes, IP/user-agent fields on security events, and a protected searchable admin page are incomplete.
- Locations: `app/Models/SecurityAudit.php`, `app/Models/ClinicalFormAudit.php`, related migrations/controllers; no audit-log route/page exists.
- Risk: Incomplete incident reconstruction and accountability for sensitive actions.
- Recommended fix: Add an append-only audit service, request context columns, redaction rules, indexed filters, admin-only policy/routes, and retention controls.
- Changes implemented: Existing logs preserved; no partial replacement was introduced.
- Testing performed: Audit call sites and schemas reviewed.

## Medium

### Production session/environment hardening depends on deployment configuration

- Vulnerability: The checked local environment uses `APP_DEBUG=true`, unencrypted sessions, and no explicit secure-cookie value. `.env` is correctly ignored and is not tracked.
- Locations: `.env`, `.env.example`, `config/session.php`
- Risk: If local values are copied to production, error details or cookies/sessions may receive weaker protection.
- Recommended fix: In production set `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_ENCRYPT=true`, `SESSION_SECURE_COOKIE=true`, `SESSION_HTTP_ONLY=true`, and `SESSION_SAME_SITE=lax` or stricter; terminate TLS and validate cached configuration during deployment.
- Changes implemented: None; changing the developer's local runtime would be disruptive and would not secure the production deployment.
- Testing performed: Effective local configuration keys inspected without printing secrets.

### Medical amendment history is not a complete first-class workflow

- Vulnerability: Finalized records are locked for ordinary clinical staff and changes are logged, but administrator corrections do not require a structured amendment reason and immutable version record across every result type.
- Locations: `ClinicalFormWorkflowService`, `PhysicalExamController`, `DoctorDiagnosticResultController`, clinical audit schema.
- Risk: Corrections may lack a uniform clinical/legal provenance chain.
- Recommended fix: Add amendment records with reason, before/after values, actor, timestamp, and supervisor authorization; never overwrite the original version silently.
- Changes implemented: Existing locks and audits retained.
- Testing performed: Finalized-result lock tests reviewed and passed.

### Sensitive supporting documents lack a download endpoint

- Vulnerability: Drug Test evidence is correctly stored on the private `local` disk, but there is no reviewed authorized retrieval route in the current route map.
- Location: `DoctorDiagnosticResultController`, `DiagnosticResult::supporting_document_path`
- Risk: Operational pressure may lead to ad-hoc public links later; authorized users currently cannot retrieve evidence through a controlled interface.
- Recommended fix: Add a policy-protected streamed download endpoint with ownership/role checks and access auditing.
- Changes implemented: None in this pass.
- Testing performed: Upload validation and storage disk usage inspected.

## Low

### Local admin diagnostic utility exposed account metadata in any environment

- Vulnerability: A standalone diagnostic script could enumerate administrator account metadata when directly executed.
- Location: `check_admin.php`
- Risk: Low-impact metadata disclosure and unnecessary production utility surface.
- Recommended fix: Restrict it to local execution or replace it with a protected Artisan command.
- Changes implemented: Added a fail-closed non-local environment guard.
- Testing performed: Formatting and full regression suite.

### Backup and restore procedure is not documented in the repository

- Vulnerability: No application-specific encrypted backup, retention, access, or restore-test runbook was found.
- Risk: Recovery may be slow or incomplete after data loss or ransomware.
- Recommended fix: Document scheduled encrypted off-host backups, restricted credentials, retention, integrity checks, and periodic restore exercises. Never store backups under `public/`.
- Changes implemented: None; infrastructure details are required.
- Testing performed: Repository documentation and storage layout inspected.

## Prioritized continuation plan

1. Centralize and test appointment/medical status transitions with role and readiness checks.
2. Build the append-only audit service and admin audit-log page, including login/failure events and redaction.
3. Add structured amendment history for finalized clinical records.
4. Add authorized, audited private supporting-document downloads.
5. Review remaining forms into dedicated Form Requests, then add upload-fuzzing and XSS payload tests.
6. Add deployment security checks and the encrypted backup/restore runbook.

## Verification result

- Focused clinical/auth security tests: 26 passed, 135 assertions during the initial run.
- Focused clinical/release regression tests after PE compatibility adjustment: 23 passed, 165 assertions.
- Full test suite: 152 passed, 1,657 assertions.
- Laravel Pint changed-file check: passed.
- Database changes in this pass: none.
