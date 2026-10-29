# Intake Screening Implementation Plan

**Goal:** Receptionists record visual acuity and hearing during intake; doctors review them without re-entering or overwriting them.

**Design:** Extend the existing timestamped vital-sign records with nullable screening columns for historical compatibility. Require screening results on new intake submissions. Copy the recorded results into the physical examination when saved, ignoring doctor-submitted screening values. Preserve existing physical examination results when older intake records have no screening values. Retain the existing urgent override for missing intake.

**Tech Stack:** Laravel, Inertia, React, TypeScript.

## Tasks

- [x] Add regression tests for intake validation, recorded results, doctor tampering, and rechecks.
- [x] Add nullable database columns and intake validation/model support.
- [x] Add screening inputs and history to receptionist intake; show read-only recorded results to doctors.
- [x] Save screening results from intake into physical exams, preserving historical values.
- [x] Run relevant workflow tests, formatting, lint, and build checks.
- [x] Apply the additive migration to the local application database.

Validation: 84 relevant workflow tests pass; TypeScript, targeted ESLint, Prettier, PHP formatting, and production build checks pass. Local migration applied successfully.
