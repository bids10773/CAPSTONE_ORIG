# Clinical and company report verification

QR verification now covers laboratory PDFs, individual laboratory-test PDFs, X-ray PDFs, pre-employment/annual examination PDFs, and released company Excel reports. Medical certificates retain their existing verification URLs.

| Report | Official verification prerequisite |
| --- | --- |
| Laboratory | Finalized result; any requested drug test must be verified |
| X-ray | Completed, confirmed, and verified result |
| Pre-employment / annual examination | Finalized and released medical examination |
| Clinical results belonging to a PE package | The package must also be released |
| Company bulk report | Released report and an existing, uncancelled event |

Cancelled/rejected appointments and absent visits do not qualify. Existing staff preview/download permissions remain unchanged; draft exports receive no official QR. Verification never grants access to the underlying document.

The application creates a unique, stable random link the first time an authorized export of an official report is requested. `/verify/report/{token}` is public and rate-limited, uses no-store/noindex/no-referrer policies, and shows only report type/reference, masked patient/company name, responsible professional/clinic, official date, and status. It queries live source readiness: an exported report that becomes unfinished, unreleased, or cancelled shows **Withdrawn**. Deleted sources return 404. Clinical findings, diagnoses, employee rosters, signatures, private download links, and complete patient/company names are excluded.

Company report downloads include a separate **Verification** worksheet containing the reference, clickable verification URL, and QR image. The original saved workbook is left unchanged; result cells and their literal data types are preserved. Unreleased admin review downloads retain the original workbook without verification. The examination PDF uses a compact header QR so its consolidated form and attachments remain intact.

## Deployment and existing documents

The local migration `2026_10_29_100000_create_report_verifications_table` has been applied. Deploy the code and run `php artisan migrate --force` in production. Verification uses the same `MEDICAL_CERTIFICATE_VERIFICATION_URL=https://lmichealth.company` public base as certificates; the domain must serve this application with the same production database and HTTPS. See [certificate deployment](certificate-verification.md) for host configuration.

Download existing official reports again to include verification. Previously downloaded files do not gain QR codes automatically. Local report tokens cannot verify against an unrelated production database. No public-domain deployment is performed by this workspace change.

QR lookup confirms a corresponding clinic record and current official state. It does not cryptographically authenticate every result or spreadsheet cell; certificate-based digital signing remains separate.
