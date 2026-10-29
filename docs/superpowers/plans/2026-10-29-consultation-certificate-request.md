# Consultation / Certificate Request Implementation Plan

**Goal:** Patient chooses Medical Consultation / Certificate Request, selects a doctor, books, undergoes examination and only doctor-requested additional services, then receives a justified, doctor-approved and issued certificate through reception.

**Architecture:** Reuse the examination form and available service catalog. Keep certificate approval and physician issuance separate from the existing Medical Documents receptionist release workflow. Keep the persisted medical_clearance purpose for existing records.

**Tech Stack:** Laravel, Inertia, React, Pest.

## Agreed design

Booking label: Medical Consultation / Certificate Request.
Description: For patients who need a medical checkup, sick leave assessment, or medical certificate.
The consultation starts with PE only. Additional system services are ordered by the doctor during examination, not selected by the patient. The certificate editor follows examination. Approval and issuance require completed examination and requested services. Reception reviews the issued document, marks it ready, and records its release using Medical Documents. No certificate is automatically approved or issued.

## Tasks

- [x] Add failing regressions for examination entry, optional service orders, completion checks, and receptionist release.
- [x] Route certificate appointments through examination and enable available service orders on that form; preserve other appointment flows.
- [x] Enforce examination and requested-service completion before approval and issuance; expose service progress for physician review.
- [x] Update booking copy and consultation-only initial services, and link issued certificates to receptionist release.
- [x] Run certificate/examination/document tests, frontend checks and formatting; review the changes.

## Review focus

Unauthorized doctors cannot order services or approve certificates. Unsupported services cannot be ordered. Patients cannot pre-order tests through certificate bookings. Pending requested results prevent approval, including via save-and-approve. Existing pre-employment and annual flows remain intact. Reception cannot release an unissued certificate.

## Execution notes

User authorized implementation with “now proceed” after correcting the flow. Work stays in the shared workspace to preserve existing uncommitted edits; no branch, commit or merge is part of the requested delivery. Existing Medical Documents policies already restrict release to issued certificates and authorized reception/admin users.

Review fixes: new laboratory sections reopen a finalized report while preserving results; new lab sections wait for pending Drug Test verification to complete, avoiding the existing verification form's field lock. Other services remain requestable. Consultation saves preserve service verification stages through EmployeeMedicalStatusResolver. Approved but unissued certificates can be returned for correction with a reason, clearing approval; attended consultation requests can continue after their appointment date.

Independent read-only review found no remaining important issues after these corrections. Full-suite run: 791 passed, two failures. One was an obsolete certificate shortcut assertion, now updated. The other is an unchanged PDF heading assertion: HEAD's test expects mixed-case Medical Examination Report while HEAD's template renders uppercase. Final affected workflow run: 139 tests pass, 803 assertions. Frontend: 35 tests pass, TypeScript and targeted ESLint pass, Pint and git diff whitespace checks pass.
