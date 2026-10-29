# Certificate Verification Implementation Plan

**Goal:** Add the accepted public QR verification flow on lmichealth.company for issued medical certificates.

**Architecture:** Persist unique random tokens separately from sequential certificate IDs. Public server-rendered verification exposes only masked identity and certificate metadata for issued/void records. Generate QR PNGs locally using the installed Bacon QR library, embed them in authorized print/PDF responses, and keep source documents/signatures private. Existing issued records receive tokens through a data migration. Public checks are rate-limited and uncached; links always use a configured HTTPS public base, independent of the request host.

**Files:** migration and MedicalCertificate model for token lifecycle; CertificateVerificationService for URLs/QR; public controller/Blade view/route; certificate controller and shared Blade partial for QR; medical config/env example; dedicated feature tests and deployment notes.

- [x] Write failing tests for guest verification, masking, void/draft/unknown handling, private-field omission, stable random tokens, and QR/production links.
- [x] Add token migration/backfill and model lifecycle; implement public page and local QR generation.
- [x] Embed QR and verification details in print/PDF, preserving A4 layout and existing permissions.
- [x] Verify relevant and full regression suites, formatting, public links/QR data, and document deployment requirements.

Validation: 766 backend tests passed (6,784 assertions). Ten touched PHP files passed Pint, and git diff whitespace checks passed. The local migration completed; Roberto Pido's existing issued certificate generates a QR to lmichealth.company and still renders one A4 page with the signature. The running local public route returned HTTP 200. Public-domain deployment and a physical phone scan were not performed.

Deployment of the local changes to the public domain is separate from workspace implementation. QR checks prove a matching clinic record exists; they do not provide a cryptographic PDF signature or prove that every printed clinical statement is unaltered.
