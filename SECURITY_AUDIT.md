# Security audit

**Audit date:** 2026-10-26 (Asia/Manila)  
**Target:** Local checkout at `C:\Users\adminguest\Herd\capstone`  
**Status:** Initial audit snapshot preserved below. User-approved fixes for F01, F02, F04, F06, F07, F08, F09 and F10 have been implemented locally; see the remediation addenda and their verification limits. F05's five-failure lock/reset policy has been restored at the user's explicit request, with abuse controls and a remaining deliberate-lockout risk; the sixth addendum supersedes the cooldown-only behavior in the fourth. F03's development-only Zod dependency is now updated from 4.3.6 to compatible patched 4.6.7; see the seventh addendum. No visual redesign or production deployment was made.

## Executive summary

The application has meaningful security controls, but the review confirmed issues requiring remediation before relying on it for sensitive clinical workflows. The highest application priorities are an OAuth login path that bypasses configured application MFA and a company-facing appointment response that discloses unreleased clinical details. Both were reproduced with synthetic users in an isolated in-memory database.

The live npm advisory check also identified a **High** advisory in development-only Zod. This is a confirmed affected dependency, **not a demonstrated vulnerability in the public application**. Production-only npm and Composer advisory checks returned no known advisories at audit time.

| Severity | Findings | Interpretation |
| --- | --- | --- |
| Critical | 0 identified | No Critical issue established within this assessment; this does not prove absence. |
| High | 3 | Two reproduced application vulnerabilities and one affected development dependency. |
| Medium | 6 | Recovery-session persistence, account-lock denial of service, unauthorized bulk drafts, XLSX formula injection, retained clinical browser drafts, and unsafe proxy trust. |
| Low | 1 | Account enumeration through password recovery. |

All **523 existing tests passed, with 5,137 assertions**, under explicitly isolated test configuration. Additional audit probes demonstrated weaknesses not covered by those passing tests. Automated success is not evidence that the system is secure.

## Scope, method, and boundaries

Reviewed Laravel controllers, services, policies, requests, middleware, models, authentication actions, routes, configuration, migrations/schema definitions, React source, the Python forecasting service source, dependency manifests/locks, CI workflows, deployment documentation, and security-sensitive tests. Review emphasized reachable data flows and privilege boundaries rather than treating pattern matches as vulnerabilities. It does not constitute formal proof that every execution path is safe.

References:

- [OWASP Web Security Testing Guide v4.2](https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/): authentication, authorization, sessions, input validation, configuration, business logic, and client-side testing.
- [OWASP Top 10:2025](https://top10.owasp.org/2025/0x00_2025-Introduction/): current category names and risk mapping. This report uses 2025 identifiers, not the different 2021 numbering.

Available Superpowers skills used: `using-superpowers`, `dispatching-parallel-agents` for independent read-only reviews, `systematic-debugging` for audit-harness issues, and `verification-before-completion`. No dedicated security audit skill was present in the available skill catalog. A suggested but uninstalled security plugin was not treated as an installed scanner.

Safety controls:

- No production/staging targets, OAuth providers, real email recipients, real user records, application database files, logs, or backup contents were tested or read.
- HTTP probes ran inside the Laravel test harness, not against the user's running data-bearing application. Database configuration was checked to be SQLite `:memory:` before migrations or fixtures.
- Test environment explicitly used array mail, cache and sessions, synchronous queues, and null broadcasting. Additional probes faked mail/notifications and blocked unexpected Laravel HTTP client requests.
- Temporary probes used random test encryption keys, disposable synthetic users, reserved-domain emails, and harmless marker strings. The XLSX probe used only `=1+1`; no external formula targets or spreadsheet application were used.
- No brute-force campaign, load test, decompression bomb, exploit against a dependency, destructive migration against an existing database, or model deserialization was performed.
- External requests were limited to security references and package registry/advisory metadata. These are not tests against external applications.
- Local environment flags and secret presence were inspected without including secret values. The secret scan emitted locations only and skipped record/log/database content.

Evidence labels below distinguish **runtime-confirmed**, **source-confirmed**, **advisory-confirmed**, and **deployment-dependent/unverified** observations. Source line references apply to the audited checkout.

## Prioritized findings

### F01 — High: Social authentication bypasses application MFA

**Status:** Runtime-confirmed with mocked Google identity; live provider integration not exercised.  
**Mapping:** A07:2025 Authentication Failures; WSTG-ATHN-10 (weaker alternative authentication).

**Affected:** `app/Http/Controllers/Auth/SocialAuthenticationController.php:60`, `:74`, `:102`, `:170`, `:180`; compare the normal MFA pipeline in `app/Providers/FortifyServiceProvider.php:70`.

The callback can resolve an existing linked account or a trusted Google email matching an existing staff account, then call `Auth::login($user, true)` directly. It does not check confirmed two-factor enrollment or create a pending Fortify MFA challenge. Account-active and lock checks do run, and the session regenerates, but configured application MFA is skipped.

**Safe reproduction performed:**

1. In the isolated database, create a verified, active doctor using `User::factory()->withTwoFactor()`.
2. Mock Socialite to return a verified Google identity with that synthetic doctor's email.
3. Request `/auth/google/callback` without supplying any TOTP or recovery code.
4. Observe HTTP 302 to `/doctor/dashboard`, `auth()->check() === true`, and `session()->has('login.id') === false`.

**Impact:** Access to the linked identity provider account is sufficient to bypass the clinic's enrolled second factor, including for staff. This is not evidence that the identity provider itself is compromised.

**Recommended fix:** Route resolved OAuth users through equivalent MFA enforcement before creating a fully authenticated session or persistent remember token. Apply the same rule to linked accounts and email-based linking. Add positive and negative tests for enrolled users, recovery codes, inactive users, and role preservation.

### F02 — High: Company appointment responses expose unreleased clinical records

**Status:** Runtime-confirmed, including a cross-company denial control.  
**Mapping:** A01:2025 Broken Access Control; WSTG-ATHZ-02/03 and business workflow checks.

**Affected:** `routes/web.php:154`, `:161`; `app/Policies/AppointmentPolicy.php:14`, `:84`; `app/Http/Controllers/AppointmentController.php:504`, `:527`, `:528`, `:538`; `app/Models/MedicalHistory.php:25`; `app/Models/LabResult.php:11`.

An owning company may view a company-referral appointment. The controller loads complete clinical relations and only sanitizes them for callers whose role is `patient`. A company caller receives the complete appointment model, including medical history and draft laboratory results. Download/release checks on separate PDF endpoints do not protect the Inertia page payload.

**Safe reproduction performed:**

1. Create synthetic company A, its company account, and a patient with an A-owned `company_referral` appointment in `accepted` state.
2. Add medical history `SYNTHETIC-PRIVATE-HISTORY` and a draft lab result with remarks `SYNTHETIC-UNRELEASED-LAB`.
3. As A's company account, GET `/appointments/{synthetic-id}`.
4. Observe HTTP 200 and both markers in the returned Inertia page data, without completing or releasing the result.
5. Control: company B receives HTTP 403 for the same appointment. The owning patient's response is HTTP 200 with both markers absent.

**Impact:** An employer can receive sensitive history and preliminary findings that have not passed the intended clinical release workflow. The issue is response-level authorization, even though appointment ownership is checked correctly.

**Recommended fix:** Serialize an explicit role-aware response allowlist. Company responses should contain only fields the clinic authorizes for employers and only at the required release state. Test raw HTML/Inertia JSON, not only visible UI or PDFs, across patient, own-company, other-company, and clinical roles.

### F03 — High advisory: Affected Zod in development dependencies

**Status:** Advisory-confirmed; application exploitability not established.  
**Mapping:** A03:2025 Software Supply Chain Failures; WSTG configuration/component review.

**Affected:** `package-lock.json:9872` (`zod` 4.3.6); dependency path through `eslint-plugin-react-hooks` at `package-lock.json:6088` and `package.json:28`.

The live full npm audit reports [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), concerning excessive memory consumption during collection validation, for Zod versions below 4.6.6. The advisory reports a patched version of 4.6.6. `npm explain zod --json` identifies this installation as development-only, through `eslint-plugin-react-hooks` and its validation helper.

**Safe reproduction performed:** Run the read-only live commands `npm audit --json --ignore-scripts --prefer-online --offline=false` and `npm explain zod --json`. Audit returned exit 1 with one High advisory. `npm audit --omit=dev` returned zero advisories. No resource-exhaustion payload was run.

**Impact:** Affected code exists in the tooling dependency tree. No reachable public request handler using Zod was identified. Do not describe the web application as remotely exploitable based on this advisory alone.

**Recommended fix:** After approval, update the compatible dependency resolution to a patched version and validate lint/build compatibility. Review actual reachability in developer/CI workflows. Audit all dependencies in CI, because the current production-only npm gate omits this finding. Do not use forced upgrades indiscriminately.

### F04 — Medium: Password recovery does not revoke existing sessions

**Status:** Runtime-confirmed for recovery; source-confirmed for the related password-settings path.  
**Mapping:** A07:2025; WSTG-ATHN-09 and session-management testing.

**Affected:** `app/Actions/Fortify/ResetUserPassword.php:26`; `app/Http/Controllers/Settings/PasswordController.php:27`; `bootstrap/app.php:34`; supporting framework behavior at `vendor/laravel/fortify/src/Actions/CompletePasswordReset.php:20` and `vendor/laravel/framework/src/Illuminate/Auth/SessionGuard.php:189`.

Recovery changes the password and rotates the remember token, but the web middleware stack does not include password-hash session validation and no active sessions are revoked. The settings controller also updates the password without revoking other sessions.

**Safe reproduction performed:** Log in a synthetic account normally; retain its session; complete a reset through the password broker with a valid synthetic token, invoking the configured reset action and rotating the remember token as Fortify does. Re-resolve the auth guard so it cannot reuse the previously cached user. The old session still receives HTTP 200 from `/settings/profile` and is authenticated. Broker status is `passwords.reset`.

This demonstrates server-side acceptance of the existing session. A separate two-browser test against a disposable database-backed session store was not run.

**Impact:** A stolen session can remain usable after the account owner recovers the password. The attacker must already possess a valid session.

**Recommended fix:** Define a session-revocation policy for recovery and password changes. Enforce password-hash session validation and/or revoke persistent sessions safely, preserving the intended current session only when appropriate. Cover database and any supported alternate session drivers, remember cookies, and recovery with independent clients.

### F05 — Medium: Unauthenticated failures can indefinitely lock an account

**Status:** Source-confirmed and covered by passing existing behavior tests.  
**Mapping:** A06:2025 Insecure Design / A07:2025; WSTG-ATHN-03.

**Affected:** `app/Security/LoginRateLimiter.php:22`, `:41`, `:45`; `app/Http/Controllers/Auth/SocialAuthenticationController.php:172`; `tests/Feature/Auth/AuthenticationTest.php:213`, `:262`.

Five failed attempts persist `login_locked_at` on the target account. The lock has no timeout, and known-account checks depend on that flag rather than the normal expiring counter. Correct passwords and social login remain blocked until email password recovery. Failed counts accumulate at account level.

**Evidence/reproduction:** Existing synthetic tests submit five failures, verify correct credentials are blocked, advance time by 61 seconds, and verify the account remains blocked. Those tests passed in the full suite. No real account was locked during this audit.

**Impact:** Someone who knows an email can deny that person's future logins and repeat the interruption after recovery. Existing logged-in sessions are not shown to be terminated by this lock.

**Recommended fix:** Review the lockout policy with the owner before changing behavior. Prefer bounded backoff and balanced account/IP controls with abuse alerts and a usable recovery path. Test distributed attempts, cooldown, repeated recovery/lock cycles, and shared-IP behavior.

### F06 — Medium: Patients can create bulk appointment drafts for arbitrary companies

**Status:** Runtime-confirmed.  
**Mapping:** A01:2025 / A06:2025; WSTG-ATHZ-03 and business-logic validation.

**Affected:** `routes/web.php:154`, `:158`; `app/Http/Controllers/AppointmentController.php:248`, `:278`, `:279`, `:440`, `:453`.

The shared booking endpoint accepts both patient and company accounts. Company submissions have their company/type set from the authenticated identity, but patient submissions are not forbidden from choosing `type=company_bulk` and another existing `company_id`. Generic persistence writes those supplied values.

**Safe reproduction performed:** As a verified synthetic patient, POST `/appointments` with another synthetic company's ID, `type=company_bulk`, a future weekday, `service_types=['CBC']`, `service_location='clinic'`, valid synthetic contact fields, and `expected_employee_count=1`. The response was HTTP 302 with no validation errors, and a pending bulk draft existed in the disposable database under the chosen company and patient's user ID.

**Impact:** Unauthorized business records can be attributed to a company. No employee enrollment, company-account impersonation, or additional clinical read access was demonstrated from this issue.

**Recommended fix:** Authorize appointment type by caller role before validation/persistence. Derive company ownership from server-side authenticated relationships. Add tests rejecting patient bulk submissions and foreign-company IDs while retaining legitimate bookings.

### F07 — Medium: XLSX exports interpret untrusted text as formulas

**Status:** Source-confirmed input flow and runtime-confirmed output writer behavior.  
**Mapping:** A05:2025 Injection; WSTG input validation/client-side output checks.

**Affected:** `app/Services/CompanyEmployeeImportService.php:264`, `:273`, `:278`; `app/Services/CompanyBulkMedicalReportService.php:125`, `:203`, `:212`; installed default binder at `vendor/phpoffice/phpspreadsheet/src/PhpSpreadsheet/Cell/DefaultValueBinder.php:61`.

Imported names accept arbitrary text subject to presence/length checks. Report rows pass names and other text to `setCellValue`, whose default binder recognizes a leading `=` as a formula. Company names also use this method. Existing CSV escaping elsewhere does not protect XLSX output.

**Safe reproduction performed:** Invoke the existing report spreadsheet writer with a synthetic row containing name `=1+1`, write a disposable XLSX, and inspect `xl/worksheets/sheet1.xml`. The output contains `<f>1+1</f>`. A separate binder check reports cell type `f`. No spreadsheet client or external-data formula was executed. The complete import-to-release workflow with this payload was traced in source, not replayed end to end.

**Impact:** A recipient can open a workbook containing attacker-supplied formulas. External access or further execution depends on the formula and spreadsheet client's security controls; neither was demonstrated.

**Recommended fix:** Use explicit string types for user-controlled text cells, including names, employee numbers, company names and free text. Keep intended numeric/date fields typed separately. Test literal preservation of harmless formula-like text in actual generated XLSX XML.

### F08 — Medium: Clinical browser drafts survive logout without account isolation

**Status:** Source-confirmed; browser interaction not executed.  
**Mapping:** A01:2025 / A04:2025; WSTG-CLNT-12 (browser storage).

**Affected:** `resources/js/hooks/use-session-draft.ts:18`, `:44`, `:73`; `resources/js/pages/doctor/physical-exam-form.tsx:136`, `:158`; `resources/js/pages/medtech/lab-results-form.tsx:112`; `resources/js/pages/radtech/xray-report-form.tsx:98`; `resources/js/components/logout-modal.tsx:38`.

The hook stores full clinical form data as JSON in `sessionStorage`. Keys include the appointment/form identifier but not the current account. Logout removes an appointment item from `localStorage` but does not remove clinical drafts. A 24-hour age check occurs on a later hook read, rather than deleting data at logout or automatically on expiration.

**Safe reproduction to run in a disposable browser profile:** Clinician A enters `SYNTHETIC-DRAFT` into a synthetic clinical form, waits for draft saving, and logs out without closing the tab. Sign in as B in the same tab and inspect only the synthetic `clinical-form-draft:v1:*` keys. The prior JSON remains available. A subsequent clinician authorized for the same form may also restore A's draft automatically. Do not inspect existing real clinical storage.

**Impact:** Confidentiality and draft integrity on shared clinic workstations. This does not establish that B can bypass backend appointment policies.

**Recommended fix:** Avoid persistent client storage of sensitive histories where possible. Otherwise isolate drafts by account and clear them on logout, identity change and session expiry. Test cross-account isolation, failed logout handling and expiration cleanup.

### F09 — Medium: Every immediate peer is trusted to supply forwarded headers

**Status:** Runtime-confirmed middleware behavior; production exploitability is deployment-dependent.  
**Mapping:** A02:2025 Security Misconfiguration; WSTG configuration, host-header and rate-limit checks.

**Affected:** `bootstrap/app.php:24`–`:29`; framework handling of `REMOTE_ADDR` at `vendor/laravel/framework/src/Illuminate/Http/Middleware/TrustProxies.php:103`; reset-link URL generation at `app/Providers/AppServiceProvider.php:46`.

Proxy trust uses `at: 'REMOTE_ADDR'` and accepts forwarded IP, host, port and protocol. This trusts whichever peer makes the connection, rather than restricting trust to known proxy addresses. No application host allowlist was found.

**Safe reproduction performed:** Pass a synthetic HTTP request directly through the configured proxy middleware with immediate peer `127.0.0.1`, `X-Forwarded-For: 203.0.113.77`, `X-Forwarded-Host: audit.invalid`, and `X-Forwarded-Proto: https`. The request is reported as IP `203.0.113.77`, host `audit.invalid`, and secure despite its underlying HTTP URL. No external hostname was contacted and no reset email was sent.

**Impact:** If an attacker can reach the backend directly, or the real proxy preserves attacker-supplied headers, IP-based throttling/audit context can be spoofed and URL/security decisions influenced. Reset-link poisoning was not demonstrated. A correctly isolated and sanitizing reverse proxy can mitigate reachability.

**Recommended fix:** Trust only the actual proxy addresses/ranges and required headers; restrict allowed hosts and backend network access. Verify trusted headers are overwritten at the edge. Test actual deployment topology and generated reset/verification URLs using synthetic accounts.

### F10 — Low: Password recovery reveals registered email addresses

**Status:** Runtime-confirmed; absence of route-level throttling confirmed in source.  
**Mapping:** A07:2025; WSTG-IDNT-04 / WSTG-ATHN-09.

**Affected:** `vendor/laravel/fortify/routes/routes.php:64`; `vendor/laravel/fortify/src/Http/Controllers/PasswordResetLinkController.php:45`; `vendor/laravel/fortify/src/Http/Responses/FailedPasswordResetLinkRequestResponse.php:38`; `vendor/laravel/fortify/src/Http/Responses/SuccessfulPasswordResetLinkRequestResponse.php:36`; `config/auth.php:100`.

The default recovery response distinguishes an existing email from an absent one. The reset-link route has no request-level throttle in the inspected registration. The broker's existing-user token issuance throttle does not uniformly throttle lookups of absent addresses or queries across many addresses.

**Safe reproduction performed:** With notifications faked, send JSON POST `/forgot-password` for a synthetic existing address and `absent@example.test`. Responses are HTTP 200 and HTTP 422 respectively. No email was sent.

**Impact:** Account discovery can aid targeted phishing and lockout attacks. Bulk enumeration and mail abuse were not attempted.

**Recommended fix:** Return a consistent generic message/status and comparable handling for existing and absent addresses. Add balanced request limits and abuse monitoring. Add tests for uniform responses and throttling without relying on response-time microbenchmarks alone.

## Security-check coverage and observed controls

| Requested area | Evidence and assessment |
| --- | --- |
| Login / registration | Standard password login uses Fortify; explicit registration attributes create only patient accounts (`app/Actions/Fortify/CreateNewUser.php:98`, `:105`). Existing role-spoofing, inactive-account and cross-role route tests pass. OAuth exception: F01. |
| Password hashing / validation | User password cast hashes values; validation enforces confirmation, minimum eight characters and three character categories (`app/Concerns/PasswordValidationRules.php:20`; `app/Rules/PasswordComplexity.php:19`). No plaintext password persistence established. Consider longer passphrases and breached-password screening as improvements. No exhaustive timing/hash-cost benchmark performed. |
| Sessions / logout | Standard session regeneration and logout invalidation exist; HTTP-only and SameSite=Lax defaults exist. Recovery-session revocation and browser draft cleanup gaps: F04/F08. Secure transport depends on deployment. |
| Password reset | Framework broker uses expiring tokens, with 60-minute expiry and 60-second issuance throttle in `config/auth.php`. Recovery resets the account lock. F04/F10 remain. Expired/replayed tokens and independent persistent clients need additional tests. |
| Brute force / MFA | Login failures and MFA challenges are limited; challenge limiter is five/minute by pending login ID (`app/Providers/FortifyServiceProvider.php:189`). Permanent account lock creates F05; OAuth creates F01. Registration and reset submissions need explicit abuse-control review. |
| RBAC / protected routes | Server-side `RoleMiddleware`, global active-account enforcement, email verification groups, gates and policies are present. Admin/staff/patient/company tests pass. Client-side menus are not the sole access boundary. F02/F06 are exceptions. |
| IDOR / ownership | Appointment policies, company query scopes, notification owner relationships and private per-user broadcast authorization exist (`routes/channels.php:5`). Additional synthetic company-B denial returned 403. No generalized IDOR absence is claimed. |
| SQL injection | Reviewed raw SQL uses static fragments and parameter binding; import duplicate matching at `app/Services/CompanyEmployeeImportService.php:420`, `:424`, `:426` is bound. No confirmed SQL injection. Driver-specific integration/fuzz testing was not performed. |
| XSS / HTML rendering | React interpolation and escaped Blade templates are used. Two `dangerouslySetInnerHTML` paginator-label sites in `resources/js/pages/medical-documents/index.tsx:333`, `:339` receive framework pagination labels; no attacker-controlled source established. No confirmed XSS; browser payload matrix not executed. |
| CSRF | Routes use Laravel web middleware; no CSRF exceptions/removals found. Direct CSRF middleware probe, with the unit-test bypass explicitly disabled, rejected a POST without a token. Existing feature tests alone would not establish CSRF protection because test mode bypasses it. SameSite and CSRF are complementary controls. |
| Validation / mass assignment | Form Requests and explicit attribute lists protect reviewed writes. Profile updates use validated data. F06 is a role/type authorization gap despite valid input, not a proven generic mass-assignment exploit. |
| Uploads | Reviewed signature/license/evidence uploads validate MIME/type/size and use generated paths. Licenses are private and downloads authorized. Public signatures and spreadsheet parsing remain concerns below. Malformed-file and decompression tests were deliberately not run against a live service. |
| API authentication / authorization | Laravel `/api/*` endpoints are registered under authenticated web routes; role/policy checks apply. Responses need explicit minimization (F02). Python service has no app-level authentication, discussed below. |
| API rate limiting | Booking, global search, inquiries, OAuth and several sensitive actions have limits. Not every lookup/import endpoint has its own quota. Python inference routes have no application limiter. No saturation test performed. |
| CORS / WebSockets | No custom permissive HTTP CORS policy found in reviewed configuration; session APIs use same-origin web routing. Reverb uses `allowed_origins=['*']` (`config/reverb.php:85`) and application rate limiting defaults off (`:92`); private channel authorization is present. These are not proof of cross-origin data theft; verify real handshake, Origin and edge controls. |
| API validation / errors | Laravel validation and ML response schema checks exist. `ml_api/main.py:14` accepts a free-form dictionary: `{}`/null input raises `TypeError` in an isolated function probe. Full service/debug response behavior was not executed. |
| Frontend secrets / storage | Pattern scan of 555 tracked text files (excluding record/database content) found no private-key, AWS-key, GitHub-token or matching literal API-secret patterns. This is a bounded heuristic, not an exhaustive secret/history scan. No frontend bearer-token storage found. Public Reverb app keys are not equivalent to Reverb server secrets. F08 covers clinical storage. |
| Debug / environment | Local `.env` has local mode and debug enabled, which is not itself proof of a production vulnerability. `.env` is ignored/untracked. Template defaults are for local development; see deployment risks. No production secrets or cached production configuration inspected. |
| HTTPS / headers | Security middleware supplies nosniff, frame denial, referrer and permissions headers. Production adds CSP and HSTS on secure requests (`app/Http/Middleware/SecurityHeaders.php:18`–`:35`). Edge HTTPS enforcement is documented but unverified; proxy issue F09 affects trust decisions. |
| Database credentials / permissions | Credentials are environment-derived; no live values disclosed. `.env` ACL includes the owner, SYSTEM, administrators and two additional SID entries with Modify rights; ownership/purpose of those SIDs was not resolved. No access violation established. Production database privileges, TLS and filesystem permissions remain unverified. |
| Backups / integrity / audit | Backups have generated filenames, sanitized table filenames and checked AES-256 entry encryption (`app/Services/DataBackupService.php:135`, `:189`). No restore-upload extraction route found. Clinical/security audit models and some event logging exist. Off-host restoration, immutable log integrity and alert delivery were not tested. |

## Dependency results

All checks were read-only. No install, audit fix, lockfile rewrite, update, or forced upgrade was performed.

| Command / check | Result |
| --- | --- |
| `npm audit --json --ignore-scripts` in sandbox | Returned zero advisories. Superseded by the explicit live check below; do not rely on the first result. |
| `npm audit --json --ignore-scripts --prefer-online --offline=false` | Exit 1; one High Zod advisory, no Critical/Medium/Low advisories. See F03. |
| `npm audit --omit=dev --json --ignore-scripts --prefer-online --offline=false` | Exit 0; zero advisories in production dependency selection. |
| `npm explain zod --json` | Installed 4.3.6; dev-only path through `eslint-plugin-react-hooks`. |
| `composer audit --locked --format=json --no-interaction --no-plugins` | Live retry exit 0; advisories `[]`, abandoned `[]`. Initial sandbox connection failed; it was not recorded as a passing check. |
| `npm outdated --json --ignore-scripts --prefer-online --offline=false` | Exit 1 with outdated-package listing; expected outdated-result status, not a security scan failure. Initial sandbox request could not fetch uncached metadata. |
| `composer outdated --direct --format=json --no-interaction --no-plugins` | Live retry exit 0; 14 outdated direct packages listed. Initial sandbox connection failed. |
| `python -m pip_audit --version` | Unavailable: `No module named pip_audit`. No Python advisory scan or transitive resolution completed; this is an explicit coverage gap. |

Outdated does not mean vulnerable. Latest major versions may require migrations and must not be applied automatically. Registry results are a point-in-time observation.

### Outdated PHP direct dependencies

| Package | Installed | Latest reported |
| --- | --- | --- |
| inertiajs/inertia-laravel | 2.0.21 | 3.5.2 |
| laravel/fortify | 1.40.0 | 1.41.0 |
| laravel/framework | 12.69.2 | 13.38.0 |
| laravel/pail | 1.2.6 | 1.2.7 |
| laravel/pint | 1.27.1 | 1.32.1 |
| laravel/sail | 1.53.0 | 1.69.0 |
| laravel/tinker | 2.11.1 | 3.0.2 |
| laravel/wayfinder | 0.1.21 | 0.1.23 |
| maatwebsite/excel | 3.1.70 | 4.0.6 |
| mockery/mockery | 1.6.12 | 1.6.15 |
| nunomaduro/collision | 8.9.1 | 8.9.5 |
| pestphp/pest | 3.8.5 | 5.3.3 |
| pestphp/pest-plugin-laravel | 3.2.0 | 5.0.1 |
| resend/resend-php | 1.15.0 | 1.17.0 |

### Outdated Node direct dependencies

`Current` is the local installed version, not the minimum allowed by `package.json`. Missing native packages can be platform-specific and are not automatically installation faults.

| Package | Current | Wanted by declared range | Latest reported |
| --- | --- | --- | --- |
| @eslint/js | 9.39.4 | 9.39.5 | 10.0.1 |
| @headlessui/react | 2.2.9 | 2.2.10 | 2.2.10 |
| @inertiajs/react | 2.3.17 | 2.3.29 | 3.9.1 |
| @laravel/echo-react | 2.5.0 | 2.6.1 | 2.6.1 |
| @laravel/vite-plugin-wayfinder | 0.1.7 | 0.1.11 | 0.1.11 |
| @radix-ui/react-avatar | 1.1.11 | 1.3.1 | 1.3.1 |
| @radix-ui/react-checkbox | 1.3.3 | 1.4.1 | 1.4.1 |
| @radix-ui/react-collapsible | 1.1.12 | 1.2.1 | 1.2.1 |
| @radix-ui/react-dialog | 1.1.15 | 1.3.1 | 1.3.1 |
| @radix-ui/react-dropdown-menu | 2.1.16 | 2.2.1 | 2.2.1 |
| @radix-ui/react-label | 2.1.8 | 2.1.17 | 2.1.17 |
| @radix-ui/react-navigation-menu | 1.2.14 | 1.4.1 | 1.4.1 |
| @radix-ui/react-select | 2.2.6 | 2.4.1 | 2.4.1 |
| @radix-ui/react-separator | 1.1.8 | 1.2.0 | 1.2.0 |
| @radix-ui/react-slot | 1.2.4 | 1.5.0 | 1.5.0 |
| @radix-ui/react-toggle | 1.1.10 | 1.2.1 | 1.2.1 |
| @radix-ui/react-toggle-group | 1.1.11 | 1.2.1 | 1.2.1 |
| @radix-ui/react-tooltip | 1.2.8 | 1.4.1 | 1.4.1 |
| @rollup/rollup-linux-x64-gnu | Not installed | 4.9.5 | 4.65.1 |
| @rollup/rollup-win32-x64-msvc | 4.9.5 | 4.9.5 | 4.65.1 |
| @tailwindcss/oxide-linux-x64-gnu | Not installed | 4.3.3 | 4.3.3 |
| @tailwindcss/oxide-win32-x64-msvc | 4.2.1 | 4.3.3 | 4.3.3 |
| @tailwindcss/vite | 4.2.1 | 4.3.3 | 4.3.3 |
| @types/lodash | 4.17.24 | 4.17.27 | 4.17.27 |
| @types/node | 22.19.15 | 22.20.5 | 26.6.5 |
| @types/react | 19.2.14 | 19.3.0 | 19.3.0 |
| @types/react-dom | 19.2.3 | 19.3.0 | 19.3.0 |
| @vitejs/plugin-react | 5.1.4 | 5.2.0 | 6.1.2 |
| concurrently | 9.2.5 | 9.2.5 | 10.0.6 |
| eslint | 9.39.4 | 9.39.5 | 10.13.0 |
| eslint-import-resolver-typescript | 4.4.4 | 4.4.5 | 4.4.5 |
| eslint-plugin-react-hooks | 7.0.1 | 7.1.1 | 7.1.1 |
| framer-motion | 12.35.1 | 12.43.0 | 14.6.0 |
| globals | 15.15.0 | 15.15.0 | 17.13.0 |
| input-otp | 1.4.2 | 1.5.0 | 1.5.0 |
| laravel-echo | 2.5.0 | 2.6.1 | 2.6.1 |
| laravel-vite-plugin | 2.1.0 | 2.1.0 | 3.2.0 |
| lightningcss-linux-x64-gnu | Not installed | 1.33.0 | 1.33.0 |
| lightningcss-win32-x64-msvc | 1.31.1 | 1.33.0 | 1.33.0 |
| lucide-react | 0.475.0 | 0.475.0 | 1.61.0 |
| prettier | 3.8.1 | 3.9.10 | 3.9.10 |
| prettier-plugin-tailwindcss | 0.6.14 | 0.6.14 | 0.8.1 |
| react | 19.2.4 | 19.3.1 | 19.3.1 |
| react-dom | 19.2.4 | 19.3.1 | 19.3.1 |
| recharts | 3.8.1 | 3.10.1 | 3.10.1 |
| sonner | 2.0.7 | 2.0.8 | 2.0.8 |
| tailwind-merge | 3.5.0 | 3.7.0 | 3.7.0 |
| tailwindcss | 4.2.1 | 4.3.3 | 4.3.3 |
| typescript | 5.9.3 | 5.9.3 | 7.0.2 |
| typescript-eslint | 8.56.1 | 8.72.0 | 8.72.0 |
| vite | 7.3.7 | 7.3.7 | 8.3.5 |

## Test execution and safe reproduction notes

The existing suite was run with PHP 8.4.25 using:

```powershell
$env:APP_ENV='testing'
$env:DB_CONNECTION='sqlite'
$env:DB_DATABASE=':memory:'
$env:DB_URL=''
$env:MAIL_MAILER='array'
$env:QUEUE_CONNECTION='sync'
$env:CACHE_STORE='array'
$env:SESSION_DRIVER='array'
$env:BROADCAST_CONNECTION='null'
php -d memory_limit=512M vendor/pestphp/pest/bin/pest --compact --no-coverage
```

Result: exit 0, **523 passed / 5,137 assertions**, duration 101.10 seconds. These environment values were scoped to the test process. `phpunit.xml` also selects isolated services. The suite includes auth, role restrictions, onboarding, medical-document release, clinical validation, imports and ownership cases. Full frontend build/lint was not rerun because application code was not changed and those checks would not establish the investigated security properties.

Additional disposable local probes produced:

```text
oauth_mfa: status=302, authenticated=true, pending_challenge=false
company_unreleased_response: status=200, history=true, lab=true
other_company_denied: 403
patient_response_sanitized: status=200, history=false, lab=false
patient_forged_bulk: status=302, created=true, validation_errors=null
reset_enumeration: existing=200, absent=422
session_after_password_reset: broker=passwords.reset, status=200, still_authenticated=true
csrf_missing_token: rejected
xlsx_default_binder: type=f, value==1+1
report_xlsx_formula: true
forwarded_headers: ip=203.0.113.77, host=audit.invalid, secure=true
```

Initial harness setup failed because a synthetic lab fixture omitted required `encoded_by`; after supplying a synthetic actor the probes completed. An initial Inertia request also received the expected asset-version mismatch 409; the disclosure evidence above was obtained from successful normal page responses. Neither harness issue was reported as an application vulnerability.

The Python module was parsed with `ast` only, without importing it, loading the pickle, or reading its spreadsheet data. Its four declared handlers were inventoried. A separately compiled copy of only `predict` raised `TypeError` for `{}` and `{'input': None}` and returned `{'prediction': 2}` for input 1. This establishes missing function-level input validation, not the complete running service's HTTP/error behavior.

## Remaining unverified risks

These observations are not included in the confirmed finding counts. Suggested severities are conditional prioritization, not claims of exploitation.

| Potential severity | Risk, affected location, and next safe verification |
| --- | --- |
| High if public/reachable | **Unprotected ML service:** `ml_api/main.py:4`, `:13`, `:250`, `:264` defines inference routes with no authentication/authorization or application rate limiter. `docs/DEPLOYMENT.md:27` requires private deployment; `docs/DISEASE_FORECASTING.md:20` specifies loopback binding. Actual network binding/firewall/proxy isolation was not inspected. Verify only an owned deployment using a harmless unauthenticated request and network configuration review; enforce private networking and authenticated service calls where appropriate. No evidence of patient-level data disclosure from its synthetic forecasts. |
| High if model artifact is attacker-controlled | **Pickle trust boundary:** `ml_api/main.py:41` executes `joblib.load` on a fixed local model path. No upload or remote path selection was identified, so this is not confirmed attacker-reachable deserialization. Protect artifact write access, verify provenance/integrity, and inventory model-build supply chain. Do not load an untrusted pickle to test this. |
| Medium | **Public clinician signatures:** uploads use public storage at `app/Http/Controllers/Settings/ProfileController.php:60`, `app/Http/Controllers/StaffController.php:411`; `config/filesystems.php:41`, `:77` configures public serving; `resources/js/pages/settings/profile.tsx:853` uses a public URL. If deployed as documented, a learned URL bypasses application authorization. Actual anonymous serving was not tested. Verify with a new synthetic signature only; store privately if signatures are intended confidential. Random filenames are not access control. |
| Medium | **Clinical role overexposure:** `app/Http/Controllers/XrayController.php:23` and `app/Http/Controllers/LaboratoryController.php:23` return full examinations and, for laboratory, related diagnostic results. Confirm the intended medtech/radtech field-access matrix before treating cross-domain diagnoses as unauthorized disclosure. Test synthetic responses against that matrix. |
| Medium | **Spreadsheet parsing resource bounds:** `app/Http/Requests/PreviewCompanyEmployeeImportRequest.php:18` allows a 10 MB upload; `app/Services/CompanyEmployeeImportService.php:67` synchronously loads spreadsheets. Row/column filters are helpful but do not prove decompression/shared-string/multi-sheet budgets. Import routes at `routes/web.php:172` have no explicit per-route throttle. Use small controlled fixtures with strict resource limits in a disposable environment, never a ZIP bomb against a live service. |
| Medium if copied to production | **Environment/transport policy:** local debug is enabled; `.env.example:4`, `:40`, `:41` uses debug and unencrypted/non-secure development session settings. `config/session.php:172` leaves Secure-cookie behavior environment-dependent. Verify production debug off, HTTPS redirects, actual cookie flags, trusted proxies, host allowlist and error pages; inspect no secret values. No production configuration was supplied or inferred from local values. |
| Medium | **Python dependencies:** eight direct requirements are pinned in `ml_api/requirements.txt:1`–`:8`, but no Python advisory scanner was installed and no resolved transitive lock with hashes was found. Audit an isolated resolved environment before deployment, verify package provenance, and identify outdated/transitive packages. PHP/npm results do not cover Python. |
| Low–Medium | **WebSocket origins and abuse limits:** Reverb wildcard origins and disabled default rate limits need deployment-specific review; channel authorization alone does not bound connection/message abuse. Use only isolated synthetic sessions, origin tests and small quotas; do not load test the real service. |
| Low | **CSP permits inline scripts:** `app/Http/Middleware/SecurityHeaders.php:29` uses `script-src 'self' 'unsafe-inline'`. This weakens defense in depth against HTML injection; no XSS exploit was established. Consider nonce/hash-based script policy with regression coverage. |
| Low–Medium | **Sensitive caching and shared terminals:** some PDF endpoints explicitly use `private, no-store`; equivalent behavior across Inertia history, page caches and logout navigation was not browser-tested. Verify only synthetic records in a fresh browser profile, including Back after logout. |
| Medium | **Permissions/credentials:** resolve the extra `.env` ACL principals; verify production database least privilege, database TLS, restricted storage/log access, separate backup encryption key, key rotation/recovery and off-host backup restore. Local ACL metadata is not a production permissions assessment. |
| Medium | **Monitoring and workflow integrity:** audit models cover some actions, but completeness, tamper resistance, alert delivery, retention enforcement and all privileged status/amendment transitions were not established. Use synthetic audit events and a documented transition matrix. Prior historical reports were context only, not current proof of fixed or unfixed issues. |

Also unverified: live OAuth provider settings/state exchange, mail delivery/security, password reset expiry/replay behavior, valid and invalid TOTP/recovery-code replay, persistent two-client session revocation, browser exploitability, all file polyglots, DB-engine-specific behavior beyond SQLite, production web root/dotfile denial, server patch levels, DNS/TLS configuration, historical secret exposure, and external integration settings. No claim of regulatory compliance is made.

## Recommended security improvements and missing tests

1. **First address F01/F02:** enforce MFA across every login channel and make appointment serialization explicit by role and release state. Add regression tests that inspect the full response payload.
2. **Remediate the affected development dependency with approval:** choose a compatible patched resolution, validate tooling, and audit both full and production trees in CI. Track Python and transitive dependencies as well.
3. **Strengthen recovery and privilege boundaries:** revoke sessions according to a defined policy, bound lockout duration/abuse, normalize recovery responses, and reject unauthorized appointment types/company references at the backend.
4. **Protect clinical data outside the database:** isolate/clear browser drafts, type XLSX text explicitly, make signature confidentiality intentional, and test shared-workstation logout behavior.
5. **Verify deployment controls:** trusted proxy/host configuration, private ML networking, HTTPS and cookie flags, restrictive error output, production file/DB privileges and encrypted restore drills. These require evidence from an explicitly authorized owned environment.
6. **Add targeted negative tests:** OAuth MFA; cross-company and unreleased response fields; foreign-company bulk creation; two-client password recovery; cooldown and lockout abuse; reset response uniformity/limits; expired/replayed reset tokens; TOTP/recovery-code replay; real CSRF middleware; literal XLSX formulas; draft logout isolation; upload parsing budgets; CORS/Origin; forwarded-header spoofing; production headers and debug handling.
7. **Improve ongoing detection:** define a role/field access matrix, log and alert on security events with secret/clinical-data redaction, verify audit ownership/tamper protection, and document supported update/rollback procedures.

At the end of the initial audit, implementation was pending approval. The user subsequently approved implementing the two High application fixes, session revocation and unauthorized company bulk-draft prevention, spreadsheet formula protection and clinical draft cleanup, and then account-lockout abuse and recovery-enumeration fixes. Dependency upgrades and proxy-trust changes remain outside that approved implementation scope.

## Remediation addendum — 2026-10-26

The original findings, evidence and counts above describe the initial audit snapshot. The following changes address only F01 and F02:

| Finding | Local remediation | Regression coverage |
| --- | --- | --- |
| F01 | `app/Http/Controllers/Auth/SocialAuthenticationController.php` now checks enabled, enrolled Fortify MFA before authenticating. It regenerates the pending session, sets Fortify's challenge identity/remember keys, dispatches the standard challenge event and redirects to the existing challenge screen. | Google email matching, linked Google, linked Facebook, guest-only access before MFA, invalid recovery-code rejection, successful one-time recovery-code consumption, and unconfirmed enrollment. Existing inactive/locked/non-MFA tests continue passing. |
| F02 | `app/Http/Controllers/AppointmentController.php` now applies the existing status-only clinical projection to company callers as well as patients. Histories and result contents are omitted even after release; existing authorized PDF endpoints remain the route for released reports. Company X-ray completion metadata is retained for the existing document-readiness calculation. | Company/patient draft and released responses, absence of all synthetic clinical markers in the full response, exact status-field counts, unauthorized company denial and preserved assigned-doctor clinical access. Existing company PDF release/ownership tests continue passing. |

Verification after the changes:

- The new security regressions were observed failing before the production fixes: social callbacks skipped the challenge, and company responses included synthetic medical history.
- Focused social-authentication, clinical-response and company-referral tests: **27 passed, 363 assertions**.
- Full suite using the isolated environment command recorded above: **532 passed, 5,398 assertions**, exit 0, duration 109.04 seconds.
- Laravel Pint read-only check on both changed controllers and both changed/new test files: **PASS**.
- `git diff --check`: **PASS**.
- Independent read-only code review: **no blockers**. Minor remaining coverage limitation: the new response fixtures include PE, so standalone X-ray browser readiness is not exercised directly, although its required company completion metadata is asserted.

No migrations, dependency upgrades, frontend/UI edits, deployment changes or real-data tests were performed. These fixes are verified locally, not deployed. At this first remediation checkpoint, F03–F10 remained open; the next addendum records the subsequent F04/F06 fixes. Passing regressions do not establish overall application security.

## Second remediation addendum — 2026-10-26

The user approved session revocation and prevention of unauthorized bulk appointment drafts. These changes address F04 and F06:

| Finding | Local remediation | Regression coverage |
| --- | --- | --- |
| F04 | `app/Services/SessionRevocationService.php:11` rotates remember tokens and deletes the affected user's database sessions using the configured session connection/table. `app/Actions/Fortify/ResetUserPassword.php:35` revokes all of that user's sessions after a valid reset. `app/Http/Controllers/Settings/PasswordController.php:32` revokes other sessions after an authenticated password change while retaining the current session. `bootstrap/app.php:38` applies Laravel's password-fingerprint session middleware. The login event at `app/Providers/AppServiceProvider.php:36` seeds the fingerprint immediately, including for sessions that have not yet visited a protected page. | Independent synthetic browser/session IDs; rejection of two old sessions after recovery; preservation of another account's session; legacy database sessions without a fingerprint; changed-password login; invalid recovery leaving sessions intact; authenticated password change preserving its current session while rotating the remember token and revoking others; stale session rejection before its first protected request. |
| F06 | `app/Http/Controllers/AppointmentController.php:248` rejects non-company bulk-appointment creation with HTTP 403 before persistence. Trusted referral normalization and authenticated company ownership enforcement remain in place. | Patient submissions using both a foreign company and the patient's own employer are rejected with no appointment created. Existing company bulk-booking and patient referral workflows remain passing. |

Validation:

- The new tests were observed failing before the production fixes: recovery left database sessions present/usable, the first-request stale session remained accepted, password changes retained the old remember token, and patient bulk submissions returned redirects instead of 403.
- Focused session, password-reset/settings, company bulk-booking and referral suites: **42 passed, 388 assertions**.
- Full suite with isolated in-memory SQLite and array mail/cache: **539 passed, 5,446 assertions**, exit 0, duration 100.32 seconds. Session-revocation cases deliberately use database-backed sessions within that disposable database.
- Laravel Pint read-only check on all eight PHP files changed in this round: **PASS**; `git diff --check`: **PASS**.
- Independent read-only security/code review: **no blockers**.

Support boundaries: persistent multi-client tests cover the configured database session driver. Newly fingerprinted sessions on other Laravel drivers rely on the password-check middleware; alternate drivers and actual remember-cookie replay were not exercised. Pre-deployment sessions lacking fingerprints on non-database drivers require a separate session invalidation step during rollout. Requests already authorized before a reset may finish; revocation controls subsequent requests. No deployment or real user data was touched.

At this second remediation checkpoint, locally remediated findings were **F01, F02, F04, F06**, with **F03, F05, F07, F08, F09, F10** still open. The next addendum records the subsequent F07/F08 fixes. The original finding counts describe the initial audit, not the current remaining count.

## Third remediation addendum — 2026-10-26

The user approved fixing spreadsheet formula injection and clinical draft cleanup. These changes address F07 and the observed same-tab authentication lifecycle in F08:

| Finding | Local remediation | Regression coverage |
| --- | --- | --- |
| F07 | `app/Services/CompanyBulkMedicalReportService.php:204` writes the company name as an explicit string. Its row writer at `:217` treats all variable report text as literal strings; only the server-generated sequence number remains numeric. Report layout and clinical workflow are unchanged. | The real generation workflow exports a synthetic workbook with formula-like company/name/clinical text and a leading-zero employee number. The test reloads the XLSX, asserts string values/types and numeric sequence, and checks worksheet XML contains no formula nodes. |
| F08 | `resources/js/lib/clinical-draft-storage.ts` creates account-scoped v2 draft keys and an owner marker. The clinical hook synchronizes ownership before reading and checks ownership before writing. Application bootstrap and Inertia navigation synchronize identity on all pages. Successful logout clears clinical drafts and ownership; failed logout retains them. Storage exceptions do not interrupt forms/logout. | Same-account restoration; cross-account isolation and deletion; removal of legacy unowned drafts; successful/failed logout; unrelated storage preservation; guest/session-expiry navigation; identity changes outside clinical forms; blocked late writes after cleanup; cleanup on expiry read; locked forms; unavailable browser storage. |

Legacy v1 drafts have no trustworthy account ownership and are discarded rather than migrated. This intentionally removes those unsaved browser drafts; saved server records are unaffected. The existing 24-hour draft lifetime remains in place.

Validation:

- Before production changes, the XLSX regression failed because a text cell had formula type `f` rather than string type `s`. Three frontend regressions failed because another clinician restored the draft, legacy unowned data restored, and successful logout retained clinical data. Those failures were observed before implementing the fixes.
- Focused report workflow suite: **2 passed, 23 assertions**.
- Full isolated PHP suite: **540 passed, 5,464 assertions**, exit 0, duration 115.71 seconds.
- Frontend tests using Node's built-in test runner and the installed TypeScript compiler: **10 passed, 0 failed**. The tests execute the production hook, logout component and storage module with simulated React/Inertia/storage; no new testing dependencies were installed.
- Added `npm run test:frontend` and a corresponding CI check so the frontend regressions run on future changes.
- TypeScript check and ESLint on all four changed/new frontend production modules: **PASS**. The first type-check run exposed overly broad Inertia props casts; those casts were narrowed to the auth field and the checks passed afterward.
- Prettier check on the changed frontend/test/config files and Laravel Pint check on both changed PHP files: **PASS**. `git diff --check`: **PASS**.
- Production Vite build: **PASS**, exit 0, 3,887 modules transformed, completed in 1 minute 36 seconds. The initial sandbox attempt could not spawn esbuild; the authorized local retry succeeded. Nothing was deployed.
- Independent read-only security/code review: **no blockers**.

Verification limits: no real browser end-to-end test was run, so mocked lifecycle tests do not establish every browser event-ordering detail. An idle tab or a logout in another tab is recognized when the current tab subsequently navigates or reloads; no cross-tab broadcast or proactive session-expiry timer was added. Draft expiration still removes data on the next read, not through an automatic deletion timer. Browser storage cleanup is best-effort if the browser denies storage access. Existing Inertia history/cache risks remain a separate verification item.

At this third remediation checkpoint, locally remediated findings were **F01, F02, F04, F06, F07, F08**, within the verification limits above. **F03, F05, F09 and F10** remained open. The next addendum records the subsequent F05/F10 fixes. No dependency versions, migrations or production deployment were changed, and no real clinical data was used.

## Fourth remediation addendum — 2026-10-26

The user approved fixing permanent account-lockout abuse and explicit password-recovery enumeration. These changes address F05 and F10:

| Finding | Local remediation | Regression coverage |
| --- | --- | --- |
| F05 | `app/Security/LoginRateLimiter.php:19` uses expiring cache limits: five failed attempts per normalized email/IP pair in a 60-second window and twenty failed attempts across emails per IP in a 60-second window. Failed attempts no longer write permanent account locks. Old failed-login flags no longer deny password or social authentication, and successful password login clears legacy fields. Threshold events remain audited. The login response and existing screen explain a temporary cooldown; the submit button remains usable for retry after expiry. Administrative deactivation and MFA checks remain enforced. | Five failures cause a temporary block, then valid credentials work after test time advances 61 seconds; another IP can authenticate the same account; twenty failures across different emails trigger the aggregate IP limit; legacy flags cannot permanently deny valid password/social login; successful login clears its pair counter and legacy fields; existing validation, inactive-account and MFA tests continue passing. |
| F10 | `app/Http/Responses/PasswordResetLinkResponse.php` is bound to both Fortify reset-link response contracts. Existing, absent and broker-throttled addresses receive identical HTTP 200 JSON bodies or the same browser redirect/status without existence errors. The application reset-link controller reports broker/notification failures internally and returns the same public response. `routes/web.php:47` retains POST `/forgot-password` / `password.email` with guest and five-requests-per-minute/IP middleware. Input-format validation remains intact. | Identical known/absent/recently-requested JSON responses; matching browser status with no existence error; one notification for repeated broker-throttled requests; request-limit expiry; invalid email validation; generic response during a synthetic recovery-service failure; route collection compilation retains the application controller and guest/request-throttle middleware. |

Policy details: blocked requests do not extend the login cooldown. Login failure windows begin with the first failed attempt. The aggregate IP failure budget is not cleared by a successful login. Shared connections share that budget, while failures from one address do not persistently disable an account for everyone. Existing database columns for historical failed-login locks were retained for compatibility; no schema migration or database-wide cleanup was run.

Verification:

- The new regressions were observed failing before implementation: a different address remained blocked by the permanent account flag, valid legacy-locked credentials/social identity were denied, aggregate IP failures were unbounded across email addresses, and missing recovery accounts returned distinct errors/statuses.
- Focused authentication/social/recovery suites: **45 passed, 276 assertions**, before the final two recovery error/route-compilation checks were added. The final focused recovery-privacy suite: **6 passed, 33 assertions**.
- Full isolated PHP suite after all changes: **549 passed, 5,538 assertions**, exit 0, duration 154.57 seconds.
- Production Vite build: **PASS**, exit 0, 3,887 modules transformed, completed in 1 minute 33 seconds. Nothing was deployed.
- TypeScript check, ESLint and Prettier for the changed login screen: **PASS**. Laravel Pint read-only check on all eleven PHP files changed in this round: **PASS**. `git diff --check`: **PASS**.
- Independent read-only code/security review: **no blockers**.

Remaining boundaries: F09's overly broad forwarded-header trust can undermine the IP limits if attacker-supplied headers reach the backend. Distributed attackers can use multiple IPs; shared clinic/NAT connections share the aggregate limit. Production multi-instance/shared-cache behavior was not tested. Laravel's reset broker retains its 200 ms minimum timebox, but synchronous email delivery exceeding that floor can still cause timing differences; no claim of constant-time recovery or elimination of all side channels is made. Live email transport and real browser interaction were not exercised. No real accounts were locked and no real email recipients were used.

Current locally remediated findings: **F01, F02, F04, F05, F06, F07, F08, F10**, within the documented verification limits. Remaining open findings: **F03 (High development-only Zod advisory)** and **F09 (Medium proxy trust)**, plus the unverified production/Python risks. No dependency upgrades or production changes were made.

## Fifth remediation addendum — 2026-10-26

The user approved fixing F09 (overly broad proxy trust). `bootstrap/app.php:24` now installs application-specific global host/proxy middleware:

- `app/Http/Middleware/TrustProxies.php:11` trusts only explicit IP addresses or nonzero IPv4/IPv6 CIDRs from `config/http_trust.php`. Empty configuration trusts no proxy. Invalid addresses, wildcard/caller-address settings, hostnames and zero-prefix networks fail closed. The override deliberately avoids Laravel's platform-hostname auto-trust heuristics.
- `app/Http/Middleware/TrustProxies.php:29` accepts only client IP, scheme and port forwarding from configured peers. Forwarded hostnames, prefixes and RFC `Forwarded` headers are ignored.
- `app/Http/Middleware/TrustHosts.php:11` accepts the exact `APP_URL` hostname and explicitly configured literal aliases, without implicit subdomain trust. Outside local/testing environments it validates the host before dispatch, including health endpoints. Invalid canonical host configuration fails closed.
- `.env.example:6` documents empty-by-default `TRUSTED_PROXIES` and `TRUSTED_HOSTS`. `docs/DEPLOYMENT.md:62` describes ingress configuration, preserving the canonical Host header, protecting backend access, configuration-cache/process refresh and pre-release checks. The actual `.env` and production infrastructure were not changed.

Safe reproduction and regression evidence: `tests/Feature/ProxyTrustTest.php` uses synthetic request contexts and isolated in-memory storage. Before implementation, **16 tests failed and 2 passed**: forged headers controlled the client IP/host/scheme/port, unexpected production hosts reached `/up`, unsafe proxy configuration was accepted and rotating claimed client IPs bypassed recovery throttling. After implementation, the initial **18 tests passed (32 assertions)**. Additional tests cover spoofed-address login throttling, outside peers and untrusted intermediate proxy hops. Positive cases cover explicit IPv4 peers, IPv4/IPv6 CIDRs, canonical hosts and explicit aliases. No real accounts, recipients, clinical data or running remote applications were used.

Final verification: the full isolated PHP suite passed with **569 tests and 5,580 assertions**, exit 0, in 122.77 seconds. Laravel Pint read-only checks passed for all five PHP files changed in this round. `git diff --check` passed. Independent read-only security/code review found **no blockers**. No frontend code changed in this round; earlier frontend verification remains recorded above.

Deployment boundaries: this fixes the local trust policy, not the production ingress. Actual proxy addresses are unknown and must be configured before deployment behind TLS termination. With no configured proxy, all clients behind an ingress share its peer IP and forwarded HTTPS is ignored. Trusted peers must overwrite untrusted scheme/port values and construct a safe client-IP chain. An overly broad configured network or a compromised trusted peer can still forge forwarding information. Local/testing environments intentionally retain flexible hostnames. Real ingress behavior, TLS/cookies, generated OAuth/reset URLs, shared-cache limits and production health probes remain unverified. Hostname validation does not restrict request ports. Ignored RFC `Forwarded`/prefix behavior and production host validation combined with a trusted proxy were inspected in code but do not have dedicated regression cases.

F03 (High development-only Zod advisory) remains open; dependency upgrades were not authorized in this round. The remaining production/Python and browser-lifecycle verification limits recorded above also remain open. No deployment or dependency update was performed.

## Sixth remediation addendum — 2026-10-27

The user clarified that the validator requires an account lock after five failed password attempts and a completed password reset to unlock it, and explicitly approved restoring that policy with additional protections. The earlier decision to replace this requirement with a temporary cooldown changed intended behavior. This addendum supersedes the fourth addendum's F05 behavior and its claim that permanent account locking had been eliminated.

Current policy and implementation:

- `app/Security/LoginRateLimiter.php:31` persists consecutive failed password attempts in a database transaction using a row lock, caps them at five and records `account_locked_after_failed_attempts` once on the transition. Counts do not expire with cache windows or reset when the requester changes IP. Additional failures against an already locked account do not change its count or lock timestamp.
- The existing five-failures/minute/email-IP and twenty-failures/minute/IP budgets remain. A fifty-failures/hour/IP budget now limits sustained failures across accounts. Successful login and recovery do not clear aggregate IP budgets. Trusted proxy restrictions remain enforced, preventing arbitrary forwarded client IPs from bypassing these controls when the peer is untrusted.
- Password authentication checks the persistent lock after validating credentials (`app/Providers/FortifyServiceProvider.php:117`), so incorrect passwords continue receiving the same generic error for known, absent and locked accounts. A verified social identity cannot bypass the lock (`app/Http/Controllers/Auth/SocialAuthenticationController.php:175`). `app/Http/Requests/Auth/TwoFactorLoginRequest.php:11` checks the current lock before completing even an already-pending MFA challenge, removes the pending identity on denial and leaves its recovery code unused.
- `app/Providers/AppServiceProvider.php:39` re-reads and locks the account row at the final login event, including remember-cookie authentication. This provides a shared ordering point with failed-attempt writes and rejects a lock committed after an earlier credential/identity check. Denied login removes staged session/cookie state and pending MFA identity before interrupting the response. Consecutive failures clear only on completed authentication of an unlocked account; merely starting an MFA challenge does not clear them. Clearing a request cooldown never unlocks an account.
- `app/Actions/Fortify/ResetUserPassword.php:28` retains token/validation enforcement, lock clearing, session revocation and the password-change notification. A completed reset also clears the current email/IP request cooldown to permit immediate login, while leaving aggregate IP limits intact. Requesting a reset email or providing an invalid token does not unlock anything. Automatic reset emails were not added to failed-login handling, avoiding an additional email-bombing path. Generic recovery responses and request/broker throttles remain.
- The existing login screen text now states the five-failure/reset requirement. Its layout and other security fixes remain intact. Deployment notes describe policy, shared-cache requirements and operational audit monitoring.

Safe regression evidence: the first four tests in `tests/Feature/Auth/AccountLockPolicyTest.php` were observed failing before implementation (persistent lock absent, same-pair recovery still throttled, pending MFA bypass and missing hourly budget) and passing afterward. The expanded focused authentication/social/recovery group passed **48 tests with 374 assertions**. New coverage includes failures across IPs and cache windows, continued denial after cooldown, invalid reset attempts, immediate valid recovery, pending MFA denial, sustained IP throttling despite successful login, generic wrong-password responses, single lock-transition audit, completed-MFA counter reset, and preservation of account locks/aggregate limits when request cooldowns clear. Existing tests that expected cooldown-only behavior were updated to the explicitly restored policy.

Independent review identified remembered authentication and stale validated-account snapshots as additional paths needing final enforcement. Their regressions first produced **2 failures and 1 positive-control pass**. After the final-event enforcement, the focused policy suite passed **10 tests with 141 assertions**, including actual remember-cookie authentication for both locked and unlocked accounts. Follow-up read-only review found no remaining blockers.

The first full run exposed five existing date-sensitive onsite/booking test failures: fixtures used UTC `today()` while the clinic used the next calendar date in Asia/Manila. Changing fixture dates alone also exposed a separate existing UTC-based physical-examination policy expectation. The two affected test files now freeze their synthetic clock at a fixed time when both dates agree; production appointment code was unchanged. The application/clinic timezone boundary remains a separate unverified operational risk, outside this authentication fix.

Final verification after the final-event checks and test-clock corrections:

- Full isolated PHP suite: **579 passed, 5,716 assertions**, exit 0, duration **176.89 seconds**. Explicit in-memory SQLite, array mail/cache/session and null broadcasting were used; no live service or real-user data was tested.
- Production Vite build: **PASS**, exit 0, **3,887 modules**, completed in **3 minutes 25 seconds**. The sandbox could not spawn esbuild; the authorized local retry succeeded. Nothing was deployed.
- TypeScript check, ESLint and Prettier check of the changed login screen: **PASS**. Laravel Pint read-only check of all **14 changed PHP files** in this round: **PASS**. `git diff --check`: **PASS**.
- Follow-up independent read-only review: **no remaining blockers** after remembered-login and stale-snapshot enforcement were added.

Residual F05 risk: this is a policy-preserving mitigation, not elimination of account-lockout denial of service. A determined attacker who knows an email address can still force its owner through recovery, and distributed IPs can evade aggregate IP budgets. Shared clinic/NAT connections share those budgets, and a completed reset does not bypass an exhausted aggregate limit. Previously authenticated sessions are not forcibly terminated by login failures; completed recovery retains the existing session-revocation behavior. Real ingress, multi-instance cache behavior and concurrent production-database execution remain unverified. SQLite tests exercise sequential behavior; inspection of transaction/row-lock code does not establish every production concurrency interleaving.

F03 remains open. No dependency upgrades, deployments, live email delivery or real-user data access occurred in this round.

## Seventh remediation addendum — 2026-10-27

The user approved addressing F03 with a compatible dependency update and no forced upgrades. `npm explain zod` identified the development-only path through `eslint-plugin-react-hooks@7.0.1` and `zod-validation-error@4.0.2`; both accept `^3.25.0 || ^4.0.0`. The [reviewed upstream advisory GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) identifies versions below 4.6.6 as affected and 4.6.6 as patched.

`npm update zod --ignore-scripts --no-audit --offline=false` updated exactly **one package**, **Zod 4.3.6 → 4.6.7**, within those existing version ranges. The tracked dependency change is confined to `package-lock.json:9872` (version, registry tarball URL and integrity). No direct dependency, override, parent-tool update or major upgrade was introduced; no application source or UI was changed in this round. `npm ls zod` confirms both consumers use the same deduplicated 4.6.7 installation with no invalid dependency warning.

The first sandbox audit reported zero advisories while its registry metadata lookup failed in offline/cache-only mode. That result was not treated as evidence that the old version was unaffected. Official registry metadata and the upstream advisory were checked with network access, and the update and final audits were explicitly run with offline mode disabled.

Final verification:

- Live `npm audit --json --offline=false` and `npm audit --omit=dev --json --offline=false` both completed with exit 0 and **zero reported vulnerabilities**.
- Frontend regression tests passed **10/10**, exit 0; the sandbox initially blocked the Node test subprocess, and the authorized retry succeeded.
- Full frontend ESLint (`npm run lint:check`) and TypeScript (`npm run types:check`): **PASS**, exit 0.
- Production Vite build: **PASS**, exit 0, **3,887 modules**, completed in **4 minutes 36 seconds**. Nothing was deployed.
- Lockfile review confirmed only the single Zod entry changed (three lines replaced). `git diff --check`: **PASS**.

The PHP suite was not rerun for this development-tool-only dependency update; the previous **579-test / 5,716-assertion** result is recorded in the sixth addendum, not presented as a new result here.

F03's affected installed version is remediated locally. A zero-advisory scan is a point-in-time result, not proof that all dependencies or the application are secure. The previously documented production/Python/browser/timezone verification gaps and the accepted residual F05 deliberate-lockout risk remain. Nothing was deployed or tested against real-user data.

## Railway production observation — 2026-10-27

The user identified Railway as their hosting provider and `lmichealth.company` as their domain. Checks were limited to unauthenticated public landing-page requests: one HTTPS HEAD request and one HTTP GET with its body discarded. No login attempts, reset emails, OAuth flows, protected endpoints, production variable changes or user-data access were performed. Cookie values were redacted before tool output. Initial sandbox/browser-tool connectivity failed; an authorized network retry succeeded.

Observed results:

| Check | Result | Scope |
| --- | --- | --- |
| Public HTTPS | HTTPS HEAD returned HTTP 200 with normal certificate verification enabled. | Confirms this client could reach the public landing page over HTTPS; not an exhaustive TLS/certificate assessment. |
| HTTP redirect | Plain HTTP GET returned 301 with `Location: https://lmichealth.company/`. | Confirms this landing-page redirect; other routes/methods were not tested. |
| Session cookie | `laravel-session` carried `Secure`, `HttpOnly` and `SameSite=Lax`; `XSRF-TOKEN` carried `Secure` and `SameSite=Lax`. | These are response attributes, not verification of every authentication cookie or server-side session handling. The CSRF cookie intentionally remains JavaScript-readable for the frontend. |
| Browser headers | HSTS (`max-age=31536000; includeSubDomains`), CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` were present. | Presence does not establish policy completeness or protection of every response. |

The [Railway public-networking specification](https://docs.railway.com/networking/public-networking/specs-and-limits) documents forwarded HTTPS and original host information, `X-Real-IP` for client identity, and HTTP-to-HTTPS redirects. The deployed application must interpret the intended trusted ingress correctly. The local security fixes were not deployed by this agent, and whether the Railway deployment includes them is unknown. No production proxy IP ranges, Caddy/proxy topology or service isolation assumptions were inferred from these public headers. Do not substitute a wildcard for verified deployment-specific trust; the current local proxy policy explicitly rejects it.

Still unverified: actual Railway non-secret variables/effective cached configuration, deployed commit, correct client-IP handling, OAuth registered callbacks, generated reset URLs, session persistence, shared rate-limit cache and replica configuration. Database-backed cache/session storage can be shared if all instances use the same backing database/tables; the local configuration supports these drivers, but production values are unknown. The user was asked for a limited non-secret variable list and deployment status; no secret export was requested. These observations narrow earlier verification gaps without declaring production secure or modifying its configuration.

### User-supplied Railway variables — 2026-10-27

The user reported `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://lmichealth.company` and `SESSION_DRIVER=database`. They reported `SESSION_SECURE_COOKIE`, `SESSION_HTTP_ONLY`, `SESSION_SAME_SITE`, `CACHE_STORE` and `TRUSTED_PROXIES` absent. These are user-supplied settings, not values read from the deployed runtime or its configuration cache. Deployment of the latest local changes was not confirmed.

Against the current local configuration, omitted `SESSION_HTTP_ONLY` defaults to true, `SESSION_SAME_SITE` to `lax`, and `CACHE_STORE` to `database`; their absence alone is not a vulnerability. A shared database-backed cache can support shared limits without Redis if every replica uses the same database, cache tables, prefix and limiter configuration. `SESSION_SECURE_COOKIE` has no explicit true default; the observed landing-page session cookie was secure, but explicitly setting it to true is appropriate for this HTTPS-only production domain. Required cache tables are defined in `database/migrations/0001_01_01_000001_create_cache_table.php`; their deployed presence and effective shared-cache behavior remain unverified.

The proxy setting requires deployment-specific follow-up: if the latest local middleware is deployed, absent `TRUSTED_PROXIES` means no peers are trusted. Behind Railway this can cause Laravel to identify the proxy instead of each visitor and misinterpret forwarded HTTPS information. The observed secure cookie/headers do not verify client-IP handling or establish which middleware revision is deployed. Do not infer a safe wildcard or stable Railway proxy range from this variable list. No source, environment or Railway configuration was changed in response to these values.

