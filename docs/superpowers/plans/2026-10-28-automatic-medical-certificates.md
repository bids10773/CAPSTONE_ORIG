# Automatic medical certificate generation

**Goal:** Generate a linked certificate draft after final evaluation for appointments whose purpose is Medical Certificate (`medical_clearance`).

**Design:** Reuse the existing certificate workflow service and its trusted patient/doctor snapshots, numbering, and audit. Creation belongs inside the final evaluation transaction, after all required exams are complete. Open the certificate for doctor review. Approval, issuance, and printing retain their existing requirements. Do not invent recommendations or declare fitness from CBC values.

**Approaches:** Generating at booking lacks clinical findings. Automatically issuing would bypass the existing review workflow. Generate a draft at final evaluation to use the completed clinical record while preserving approval and issuance.

**Implementation:**
- [x] Add failing route tests for CBC readiness, trusted prefill and redirect, other purposes, and existing certificates; add service idempotency coverage.
- [x] Add guarded, appointment-locked draft generation to `MedicalCertificateWorkflowService`; integrate with `PhysicalExamController::finalStore` transaction and redirect.
- [x] Run relevant workflow tests, PHP formatting, and the PHP suite; inspect the focused diff.

**Decisions:** Use existing salutation conventions from recorded sex. Missing narratives/demographics remain editable in draft, never fabricate clinical facts. Preserve any previously linked certificate, including issued or void records. No backfill of historical appointments.

**Review:** Independent review identified a reused-certificate redirect leading to 403 when a different physician owns it. Added a failing route regression, then restricted redirects to actors authorized to view that certificate; others retain the queue/event destination. Missing salutations block submission until completed.

**Verification:** 69 relevant workflow tests, PHP formatting for all six changed PHP files, and `git diff --check` passed. Initial full suite: 636 passed, four failed because older downstream diagnostic fixtures omitted the newly required physical examination. Updated those fixtures to include the completed exam; their expectations and production rules are unchanged. Final full suite: **641 passed, 6090 assertions**, 134.38 seconds.
