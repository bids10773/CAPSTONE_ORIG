# Clinical form drafts

User-approved intent: incomplete clinical inputs may be saved as drafts; completing and releasing a clinical record still requires the relevant results and approvals. Patient identity, author and timestamps remain required. Blank findings must not become normal results.

Approach: retain laboratory, X-ray and certificate draft workflows. Add separate, author-owned persisted drafts for vital signs, physical examinations and final evaluations. This prevents incomplete intake from making a patient ready for consultation and prevents draft assessments from completing services. Existing completion validation remains the default for old clients. Physical findings start unselected and may explicitly be marked not assessed or not applicable with a reason.

Alternatives: relaxing all validation would allow incomplete official records; browser-only drafts would not provide an explicit server save. Neither meets the approved intent.

Constraints: preserve existing uncommitted work, role checks, numeric ranges, report locks, approvals and audit trails. No changes to booking or account registration requirements. Draft data is isolated by appointment, author and form, cleared after successful completion, and excluded from clinical readiness and reports.

Implementation decisions: an additive clinical_form_drafts table stores encrypted validated payloads; no synthetic measurements are recorded. Previously completed exams retain their historical normal findings. Invalid entered values remain errors even on drafts. Existing laboratory/X-ray partial-save behavior is verified through tests. New X-ray forms start blank until the clinician explicitly selects a classification.

Intake exceptions: individual measurements may be marked Not assessed with a reason. Values remain null, contradictory numeric readings are rejected, and reasons are retained on the vital-sign record, copied to the physical examination, and shown in review and PDF output. Historical vision/hearing results are preserved for legacy intake lacking screening fields, but an explicit Not assessed correction clears the previous screening value.
