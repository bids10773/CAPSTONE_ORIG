# Clinical License Authorization

Require a saved license number and administrator verification before doctors, medtechs, and radtechs can conduct medical examinations. Receptionists retain their intake duties without a professional license. Existing account and record-assignment restrictions remain in force. License proof upload and profile management remain accessible.

Certificate draft preparation and submission remain available as previously requested for testing; certificate approval and clinical report actions require verification.

- [x] Add regression coverage for unsubmitted, pending, rejected, blank, and verified licenses; cover clinical form access, submission, and receptionist exemption.
- [x] Add one shared user license predicate and enforce it before clinical mutation policies through Laravel Gate.
- [x] Show unverified clinical staff a clear account-verification notice without blocking license-proof upload.
- [x] Add an explicit licensed test factory state and update existing clinical workflow fixtures to model authorized staff.
- [x] Run affected checks and the full test suite, and request independent review.

Independent review found no important authorization bypasses. Clinical proof uploads and profile edits remain accessible; changing license details resets verification through the existing account workflow.

Validation: 675 backend tests passed (6,225 assertions); 32 frontend tests passed; TypeScript, targeted ESLint, Prettier, Pint, and diff whitespace checks passed.
