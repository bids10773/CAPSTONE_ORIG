# LMIC Clinical Forms Integration

## Source-form audit

| Uploaded PDF | Usable pages | Integrated form |
|---|---:|---|
| `LAB FORM.xlsx - LAB FORM.pdf` | 1 of 6 | Combined CBC, urinalysis, fecalysis, serology, pregnancy and blood typing |
| `CBC WITH UA.pdf` | 1 of 6 | Combined CBC and urinalysis |
| `CBC.pdf` | 1 of 6 | Legacy CBC |
| `NEW CBC.pdf` | 1 of 1 | Expanded CBC with age/pregnancy reference ranges |
| `URINALYSIS.pdf` | 1 of 6 | Urinalysis |
| `FECALYSIS.pdf` | 1 of 3 | Fecalysis |
| `DT.pdf` | 1 of 3 | Methamphetamine and THC drug test |
| `fbs.pdf` | 1 of 3 | Fasting blood sugar |
| `HEPA B.pdf` | 1 of 3 | HBsAg and Anti-HAV IgM |
| `PREGTEST.pdf` | 1 of 3 | Urine pregnancy test |
| `PE FORM UPDATED...pdf` | 1 of 1 | Blood chemistry—not a physical-examination form |

Blank pages and spreadsheet helper/reference print areas are not clinical documents.

## Canonical patient and encounter data

| Form field | Source |
|---|---|
| Patient name | `users.first_name`, `middle_name`, `last_name` through `User::name` |
| Birthdate, age, sex, employee number | `patient_profiles` |
| Company/agency | `appointments.company_id -> companies.company_name`, with the appointment snapshot as fallback |
| Appointment and result date | `appointments.id`, `appointments.appointment_date`, result `finalized_at` |
| Doctor | `appointments.doctor_id -> users` |
| Medical technologist | `lab_results.encoded_by` / `verified_by -> users` |
| License and signature | `users.license_no`, `users.signature_path` |

Demographics are never copied into clinical result tables.

## Laboratory field mapping

All structured result groups live on the unique `lab_results.appointment_id` record. JSON keys are validated against `LaboratoryFormDefinition`, which is also used by the React form and PDF renderer.

| Group / database column | Official fields |
|---|---|
| `cbc_results` | hemoglobin, hematocrit, RBC, WBC, segmenters, lymphocytes, monocytes, eosinophils, basophils, stab, meta, differential others, platelet count, verification note |
| `urinalysis_results` | color, transparency, pH/reaction, specific gravity, glucose/sugar, albumin/protein, WBC, RBC, bacteria, epithelial cells, mucus threads, amorphous urates, yeast, calcium oxalate, trichomonas, casts, crystals, others |
| `fecalysis_results` | color, consistency, pus cells, RBC, yeast, bacteria, parasite/ova, others |
| `drug_test_results` | methamphetamine, tetrahydrocannabinol/THC |
| `serology_results` | HBsAg, Anti-HAV IgM |
| `pregnancy_test` | qualitative urine pregnancy result |
| `blood_chemistry_results` | FBS, cholesterol, triglycerides, HDL, LDL, BUN, creatinine, SGOT, SGPT, uric acid |
| `blood_type` | ABO/Rh result |
| `remarks` | technical remarks and critical-value communication |

`status`, `is_completed`, `verified_by`, and `finalized_at` control report finalization. Finalized reports are immutable for medical staff; administrators may correct them with an audit trail.

## Existing PE and X-ray mapping

- Physical measurements and body-system findings remain in `physical_exams`.
- History remains in the unique `medical_history.appointment_id` record.
- X-ray findings and impression remain in `xray_reports`.
- Final evaluation classification and doctor remarks remain in `physical_exams`.
- Final doctor approval sets finalization metadata and locks all encounter documents.

The uploaded files do not include an official physical-examination or X-ray source layout. The system generates clean LMIC PDFs for the currently captured data, but exact paper-layout matching requires those missing originals.

## Workflow and access

- Receptionist: demographic/queue views only; clinical document routes are forbidden.
- MedTech: enter and finalize only requested laboratory sections.
- RadTech: enter X-ray findings and impression.
- Doctor: physical examination, history and final medical classification.
- Administrator: authorized clinical correction and reporting access; all mutations are audited.
- Patient: view/download completed documents belonging to their appointment.
- Company accounts: do not receive employee clinical results, protecting medical confidentiality.

Every create, update, finalize and document download is recorded in `clinical_form_audits`.
