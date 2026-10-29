# Report Verification Implementation Plan

**Goal:** Extend the approved QR verification feature to laboratory (including service-specific PDFs), X-ray, pre-employment/annual medical examination PDFs, and final company Excel reports.

**Architecture:** A unique random-token registry references source reports without exposing clinical fields. Tokens are created when an authorized export first includes verification; public lookup checks current source readiness every time. Finalized lab results (with required drug verification), verified X-rays, released examinations, and released bulk reports qualify. Draft exports remain available under existing permissions with no verification QR. A report that becomes unready/cancelled after exporting displays Withdrawn. Company workbooks receive a separate Verification sheet, preserving every existing results cell and formula-safety behavior.

- [x] Add failing tests for readiness, private field omission, stable tokens, withdrawal, all report types, and PDF/XLSX embedding.
- [x] Add registry model/migration, shared QR service support, report metadata service, public route/controller/Blade page.
- [x] Wire both laboratory PDF endpoints, clinical X-ray/examination exports, and company workbook downloads without changing access policies or saved results.
- [x] Apply local migration, verify export layout and role access, run full regressions/formatting, document deployment.

Verification: full backend suite passed 776 tests / 6,863 assertions; 12 touched PHP files passed Pint, and git whitespace checks passed. Local migration applied. PDF rendering tests verify QR images on full and service-specific lab reports, X-rays, pre-employment, and annual examinations; unrelated patient downloads remain forbidden. XLSX tests verify an added verification sheet, unchanged original bytes, and preserved leading-zero/formula-like text. Public tests cover current status, withdrawal, missing records, and private field omission. Production deployment and a physical phone scan remain outside the local verification performed.

Public verification confirms a matching clinic record and its current official status. It does not expose findings, employee rosters, diagnoses, private download links, signatures, or complete patient/company names. It does not cryptographically validate file contents. Existing medical certificate verification stays compatible.
