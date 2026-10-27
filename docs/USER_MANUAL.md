# LMIC Medical Services Management System

## User Manual

**Living Myth Industrial Clinic**  
Version 1.0 | Prepared October 27, 2026  
Coverage: Patient, Company, Receptionist, Doctor, MedTech, RadTech, and Administrator

This manual describes the workflows implemented in the current project. Available actions depend on your account role, assignments, record status, and clinic configuration. It was prepared from the application source and project documentation; live screen walkthroughs and screenshots are not included.

## Contents

1. About the system
2. Getting started
3. Navigation and common controls
4. Patient instructions
5. Company instructions
6. Receptionist instructions
7. Doctor instructions
8. Medical technologist instructions
9. Radiologic technologist instructions
10. Administrator instructions
11. Medical certificates
12. Document tracking and release
13. Understanding statuses
14. Account settings and security
15. Troubleshooting
16. Quick reference and glossary

## 1. About the system

The LMIC Medical Services Management System supports online appointments, walk-in registration, company medical programs, clinical examinations, laboratory and X-ray reports, medical certificates, document release, inquiries, and administrative monitoring.

### 1.1 User roles

| Role | Main responsibilities |
| --- | --- |
| Patient | Register, request an appointment, track a visit, and access available personal medical records. |
| Company | Refer employees, upload employee master lists, request bulk appointments, and download released company reports. |
| Receptionist | Review individual appointment requests, manage the clinic queue, record intake vital signs, handle assigned bulk attendance, and perform authorized document release. |
| Doctor | Examine assigned patients, review results, complete final evaluations, manage medical certificates, and request availability changes. |
| MedTech | Record and finalize requested laboratory services for authorized patients. |
| RadTech | Record and finalize requested X-ray findings for authorized patients. |
| Administrator | Manage accounts, companies, appointments, availability, staffing, reporting, security, backups, and authorized corrections. |

### 1.2 Before you begin

Use an internet-connected device and a current web browser. Obtain the system address from the clinic. Patients need access to their registered email; staff and company users need the credentials or invitation supplied by the clinic.

Default clinic hours in this project are Monday to Friday, 8:00 AM to 5:00 PM, Philippine time. The available dates and times shown in the booking form determine what you can select. Doctor availability and existing appointments can reduce the available slots.

## 2. Getting started

### 2.1 Register a patient account

1. Open the clinic's system address and choose the registration option.
2. Enter your first and last names and your middle name, if applicable.
3. Enter your email address and a valid Philippine mobile number.
4. Complete your birthdate, sex, civil status, and address.
5. Create a password and enter the same password in the confirmation field.
6. Complete the required acknowledgments displayed on the page and submit the form.
7. Open the verification email and follow its link. If prompted, sign in to finish verification.

**Expected result:** You can access the patient portal after satisfying verification and profile requirements. Self-registration requires the patient to be at least 18 years old. If the system detects matching patient information, use your existing account or account recovery.

Passwords must contain at least eight characters and at least three of these four categories: uppercase letters, lowercase letters, numbers, and symbols.

### 2.2 Sign in

1. Open the login page.
2. Enter your registered email and password.
3. Submit the login form.
4. If two-factor authentication is enabled, enter an authenticator code or use a recovery code.
5. Complete any email verification, temporary password, or patient profile prompt.

**Expected result:** The system opens the workspace assigned to your role. Google or Facebook sign-in may also be available when configured by the clinic. Complete any additional email or profile information requested after social sign-in.

### 2.3 First login for staff and company accounts

Use the credentials or invitation sent by the clinic. If directed to change a temporary password, enter and confirm a new password before proceeding. Contact the administrator if the invitation or credentials are missing or no longer work.

Staff and company roles are provisioned through clinic administration; patient registration does not create these roles.

### 2.4 Recover a forgotten password

1. Select the password recovery option on the login page.
2. Enter your registered email address and request a reset link.
3. Check your inbox and spam folder.
4. Open the reset link and enter and confirm a new password.
5. Return to the login page and sign in.

**Expected result:** The new password replaces the previous password. Request a new link if the previous link has expired.

## 3. Navigation and common controls

The patient portal uses navigation such as **Home** and **My appointments**. Staff and company workspaces use role-specific menus, often in a sidebar. On smaller screens, open the menu button to see navigation options.

| Control | How to use it |
| --- | --- |
| Search | Enter identifying information supported by the current page, such as a name or reference number. |
| Filters | Narrow the list by the available date, status, service, or other criteria. Clear filters if a record seems missing. |
| Pagination | Move between pages of results; the first page may not contain every record. |
| View or record link | Open the selected record and check its details before taking action. |
| Notification bell | Open a notice and follow its link to the related record. |
| Profile menu | Open your available settings or sign out. |
| Confirmation dialog | Read the record and action carefully before confirming. |

After saving, check for a success message and the updated record. A disabled or missing button can indicate insufficient permission, incomplete prerequisites, or a record that is already locked.

## 4. Patient instructions

### 4.1 Review your health overview

Sign in and open **Home** or your health overview. Review the appointment information and notices shown. Open the relevant visit to see its current status and available records.

### 4.2 Book an appointment

1. Open **My appointments** or **Appointments** and choose the booking option.
2. In **Visit**, choose the visit type and examination purpose offered to your account.
3. Select the required services. Where a package supplies services automatically, review the included items. Select the referring company when required.
4. In **Schedule** (shown as **Time** in the progress indicator), choose an available date, doctor, and time.
5. In **Details**, check and complete the patient information requested.
6. In **Review**, verify the purpose, services, patient information, and schedule.
7. Select **Confirm booking** and wait for the confirmation step.
8. Save the appointment reference and check the appointment list for its current status.

**Expected result:** The request appears as **Pending Approval** until authorized clinic staff accept or reject it. A submitted request does not reserve an approved visit until confirmation is granted.

The current system limits patients to one active or pending appointment at a time. If booking is blocked by an existing appointment, open that record and contact the clinic if it needs cancellation or correction. Select another available slot if the chosen slot becomes unavailable before submission.

### 4.3 Track an appointment

1. Open **My appointments**.
2. Use the available filters to locate the visit.
3. Open the appointment and check its reference, schedule, services, and status.
4. Check notifications for approval, rejection, reminders, or changes.

If you need to cancel or change a visit, contact the clinic with its reference number. This manual does not assume a patient self-service cancellation or rescheduling button.

### 4.4 Access medical records

1. Open the relevant appointment.
2. Review the available medical record cards or follow the link to your medical documents.
3. Check the document status and release instructions.
4. When an authorized **View or download PDF** action is available, open it and save or print the document as needed.

**Expected result:** You can access only your own authorized records. The medical documents page also tracks processing and pickup status; a document listed there is not automatically available for download. Clinical completion, release, and pickup are separate events.

### 4.5 Send and track an inquiry

Open the inquiry form from the available clinic links, complete the requested contact information, category, subject, and message, then submit it. Signed-in users can open **Inquiries** to review their inquiry history. Check the registered email for the clinic's reply.

## 5. Company instructions

### 5.1 Review the company workspace

Open **Overview** to review employee totals, upload history, referrals, and available reports. Use **Employee Records** for the company-facing employee list and **Bulk Appointments** for group booking requests.

Company accounts receive the employee status and released company reports provided by the application. They cannot open employees' detailed clinical records through the clinical staff or patient workspaces.

### 5.2 Create an employee referral

1. On the company dashboard, select the employee referral action.
2. Enter the employee's first name, last name, and email.
3. Choose the available purpose, such as pre-employment or medical certificate.
4. Select the requested medical services and submit the referral.
5. Ask the employee to check the invitation email and follow its instructions.

**Expected result:** The employee receives a referral invitation. The employee can follow the invitation, sign in or register as needed, and continue the linked booking process. Contact the clinic if an invitation has expired or contains incorrect information.

### 5.3 Request a bulk appointment

1. Start a company bulk appointment from the booking actions available in the company workspace.
2. Review the Annual Physical Examination purpose and select the services offered.
3. Choose the offered clinic or onsite location option. Enter an onsite address when required.
4. Enter the contact person, contact number, expected employee count, and preferred start date.
5. Review the request and submit it.
6. Upload and confirm the employee master list for this bulk appointment.
7. Track the request under **Bulk Appointments** and review the final approved dates.

**Expected result:** A parent bulk event is created. Administration determines the final approved schedule, duration, and required staff. The preferred start date is a request until approval.

### 5.4 Upload an employee master list

1. Download the current master-list template from the company workspace.
2. Fill in the template without changing its column headings. Supply the required employee identifiers, names, birthdates, sex, civil status, and contact details.
3. Open the spreadsheet upload panel and select the appropriate bulk appointment when enrolling employees in that event.
4. Choose an XLSX, XLS, or CSV file of no more than 10 MB.
5. Start the preview and review the valid, invalid, and duplicate row summaries.
6. Correct flagged rows in the source file and upload it again as needed. Download the error report when offered.
7. Confirm the intended import only after checking the preview.
8. Review the imported employee count and event association.

**Expected result:** Validated employees are registered or associated with the selected program. Previewing a spreadsheet does not complete enrollment; confirmation is required. Employee import does not provide employee passwords to company users.

### 5.5 Download the released bulk report

1. Open **Bulk Appointments** or the reports area on the company dashboard.
2. Locate the event and check whether its report has been released.
3. Use the available **Download** or **Download final Excel** action.

**Expected result:** The owning company receives the released report. If the download is unavailable, contact the clinic to check clinical completion and administrative release.

## 6. Receptionist instructions

### 6.1 Review individual appointment requests

1. Open **Appointment Requests**.
2. Filter the list and open the request details.
3. Check the patient, requested purpose, services, doctor, and schedule.
4. To accept, complete any required assignment or schedule fields and confirm the acceptance.
5. To reject, choose **Reject request**, provide the requested reason, and confirm.
6. Use the reminder action when it is available and appropriate.

**Expected result:** An accepted request appears as **Confirmed**. Rejection updates the request status and triggers the corresponding notification workflow.

### 6.2 Register a walk-in patient

1. Open **Queue Management** and the walk-in registration area.
2. Search for an existing patient before creating a new patient record.
3. Select the matching patient or complete the required details for a new patient.
4. Enter the visit purpose and selected services.
5. Choose an available doctor and time where required by the form.
6. Save the walk-in entry and confirm that it appears in today's queue.

**Expected result:** The visit is recorded in the clinic workflow. Check patient identity carefully to avoid duplicate records or attaching a visit to the wrong patient.

### 6.3 Record intake vital signs

1. Open the eligible individual visit and choose the vital signs action.
2. Enter the clinic-required measurements, using the units displayed on the form.
3. Complete any additional measurements and notes that were actually observed.
4. Select **Save Vital Signs**.
5. For a requested recheck or correction, use the corresponding measurement workflow and save the new measurement.

**Expected result:** The measurement is saved with its history. The doctor can review intake values without overwriting the original entry. Follow the form's permitted workflow for rechecks and corrections.

### 6.4 Manage the clinic queue

Use **Queue Management** to locate today's patients, review doctor assignments and available times, and apply the status actions allowed by the page. Check the saved status before directing the patient to the next department.

Receptionists handle intake and operational information. Clinical findings, laboratory interpretation, and final medical classifications belong to the authorized clinical roles.

### 6.5 Record bulk attendance

1. Open **Bulk Attendance**.
2. Select an event assigned to you.
3. Find the employee in that event's master list and verify their identity.
4. Mark the employee arrived or absent using the attendance controls.
5. Check the saved attendance and direct arrived employees to the required services.

**Expected result:** Arrived employees become eligible for the appropriate event queues. An absent employee remains recorded as absent and does not need a completed examination to resolve the event.

## 7. Doctor instructions

### 7.1 Open your assigned patients

Review **Dashboard** and **Appointments** for clinic visits. For an assigned company event, open **Onsite Events** and its departmental queue. Use **Patient Records** to find authorized patient history. Confirm the patient and appointment before entering clinical information.

### 7.2 Record a physical examination

1. Open the patient's examination form from the visit or queue.
2. Review patient identity, selected services, medical history, and intake measurements.
3. If a measurement needs checking, use the vital signs recheck action where available.
4. Complete the history, examination findings, and remarks required by the form.
5. Select **Save examination** and check that the record was saved.

**Expected result:** Examination findings are available for the encounter's review and final evaluation. Saving the examination alone does not release a final medical report.

### 7.3 Complete the final evaluation

1. Open **Final Evaluation** for the correct appointment.
2. Check the selected-services summary and incomplete-service notices.
3. Review the physical examination and requested laboratory and X-ray results.
4. Complete any diagnostic verification assigned to the doctor, including the drug-test workflow when required.
5. Enter the final medical classification and remarks required by the form.
6. Submit the final evaluation when all prerequisites are satisfied.
7. Review the locked record. If authorized and displayed, select **Release final report** as a separate action.

**Expected result:** Finalization locks the encounter's clinical records. Release makes the report available through the permitted patient workflow. Contact administration if a finalized record needs correction.

### 7.4 Request an availability change

1. Open **Availability**.
2. Review your current schedule and enter the proposed change.
3. Submit the request and check its status.
4. Confirm the final schedule after administrative review.

**Expected result:** The proposal enters the availability approval workflow. Do not treat a submitted request as an approved schedule change.

For certificate creation and approval, follow Section 11.

## 8. Medical technologist instructions

1. Open **Overview** and **Medtech Queue**, or the departmental queue in an assigned **Onsite Event**.
2. Select the correct patient and appointment.
3. Check which laboratory services were requested.
4. Enter results in the displayed sections using the specified units and reference information.
5. Complete required interpretations and technical remarks.
6. Use **Save draft** while the report is incomplete.
7. Follow the displayed verification workflow for drug-test results that need further review.
8. Review the completed report, choose the offered **Finalize** action, and confirm.

**Expected result:** Finalized services are marked completed and become read-only. A pending verification step must be resolved before the encounter can finish. Ask an administrator to handle a necessary correction after finalization.

Laboratory sections depend on the selected services. The system supports structured forms such as CBC, urinalysis, fecalysis, drug testing, serology, pregnancy testing, blood chemistry, and blood typing; not every encounter requests every section.

## 9. Radiologic technologist instructions

1. Open **Overview** and **Radtech Queue**, or the departmental queue in an assigned **Onsite Event**.
2. Select the patient and confirm that X-ray is requested.
3. Enter the findings, impression, and other information required by the form.
4. Choose **Save draft** if the report is incomplete or still being reviewed.
5. Follow any verification instructions displayed for the result.
6. Review the findings and impression, select **Finalize X-Ray**, and confirm.

**Expected result:** The X-ray service becomes completed and read-only after finalization. Contact administration if a finalized report needs correction.

## 10. Administrator instructions

### 10.1 Review daily operations

Open **Dashboard** for the operational overview. Use **Appointments > Today's Clinic Overview** to inspect the day's clinic workload and **Appointments > Appointments** to search and manage individual visits.

### 10.2 Manage staff

1. Open **Management > Staff**.
2. Choose the create action for a new staff account or edit an existing record.
3. Complete identity, email, contact, role, and relevant professional information.
4. Save the account and check its active status.
5. Use the available credential resend action if needed.
6. Review professional license documents using the preview steps below and update license verification where appropriate.
7. Manage signatures through the authorized controls.

**Expected result:** The staff member receives the role and access you assigned. Check the selected role before saving. Deactivating an account prevents its normal active-account access.

To review PRC proof before downloading:

1. Edit the doctor, MedTech, or RadTech account and scroll to **Credential Review > Professional License**.
2. Select **View proof**. Both the front and back images appear in a popup when both have been submitted.
3. Compare the images with the staff member's identity and saved license number. Open either image at full size in a new tab if needed.
4. Select **Verify** when acceptable, or enter **Reason if rejected** and select **Reject**.
5. Use **Download front** or **Download back** only if you need to save a copy.

The system records the administrator's verification decision. It does not automatically validate a license against PRC's database.

### 10.3 Manage companies and patients

Under **Management > Companies**, create or update company details, check the linked account and active status, and resend an invitation when needed. Under **Management > Patients**, search for a patient, inspect the record, and use authorized edit actions to correct demographic information.

Verify identity and the effect of the action before deleting any record. Use correction or deactivation when that is the appropriate operational action.

### 10.4 Manage individual appointments

1. Open the appointment list and locate the visit.
2. Review its patient, purpose, services, schedule, and assignment.
3. Use the authorized approval, rejection, creation, or status action.
4. Complete required information and confirm.
5. Check the updated record and notification status.

Authorized clinical correction pages are available to administrators. Review the original record and record the required correction information; clinical changes are audited.

### 10.5 Approve and staff a bulk appointment

1. Open **Appointments > Bulk Appointment** and select the parent event.
2. Check the company, location, requested services, contact details, and imported employee master list.
3. Select the approved event date or dates and duration offered by the form.
4. Assign a receptionist and all required clinical roles. Include MedTech and RadTech staff when the selected services require them.
5. Confirm approval and verify the saved schedule and assignments.

**Expected result:** Approval applies the accepted schedule to the event's enrolled employees. Approval is blocked if the master list or required staffing is incomplete. Staff work only in the event and queues they are authorized to access.

### 10.6 Complete an event and release its company report

1. Open the event and review attendance and each employee's progress.
2. Resolve outstanding activities through the permitted event controls.
3. Confirm that every employee is completed or absent and that no required results, verification, or evaluations remain unresolved.
4. Open the event's medical results page.
5. Select **Generate final Excel**, or **Regenerate final Excel** for an unreleased report that needs regeneration.
6. Select **Download review copy** and inspect the report.
7. Select **Release to company** and confirm.

**Expected result:** The report is locked for download by the owning company. Completing an event does not automatically release the company report.

### 10.7 Review doctor availability

Open **Management > Doctor availability**, inspect existing schedules and proposed changes, then approve or reject requests using the provided controls. Review affected appointments and any warnings before applying a change.

### 10.8 Handle inquiries

Open **Management > Inquiries**, filter and open the inquiry, read the message, send the appropriate reply, and update its status. For a relevant company inquiry, use the create-company action when offered.

### 10.9 Review analytics and disease simulation

Use **Analytics > Analytics dashboard** for patient-volume information and available forecasts. Use **Analytics > Disease simulation** for the monthly simulation, experimental weather scenario, and synthetic resource-planning views.

Select the period or scenario controls offered, wait for loading to complete, and read the displayed source and limitation notices. Disease simulations and synthetic resource scenarios support planning; they do not establish patient diagnoses or measured clinic demand. If weather or forecasting services are unavailable, report the issue and consult the data that remains available.

### 10.10 Review security information

Open **Security**, review the displayed alerts and audit information, and use **Download logs** when a copy is needed for authorized review. Protect downloaded logs and share them only with authorized clinic personnel.

### 10.11 Manage backups and retention

1. Open **Data Management**.
2. Review the current retention settings and the summary of affected records.
3. Edit the policy or scheduled backup options when authorized, then select **Save policy**.
4. To make an immediate backup, select **Create manual backup**.
5. Check the backup history for a successful status and use **Download** when available.
6. Use retention enforcement only after reviewing the affected data and confirming that permanent deletion is intended.

**Expected result:** Backup creation is recorded in the backup history. Retention enforcement creates a backup before deleting eligible data, but deletion is permanent in the active system. Restoration is an operational procedure described in the separate Backup and Recovery guide.

## 11. Medical certificates

Medical certificates use a dedicated approval and issuance workflow. Creating a certificate, approving it, issuing it, and releasing a tracked document are distinct actions.

### 11.1 Doctor: create and approve

1. Open **Medical Certificates** and choose the create action.
2. Find the correct patient and select the relevant consultation when required.
3. Complete the certificate form and review its preview.
4. Save the draft and select **Submit for approval**.
5. As the attending physician, review the submitted certificate and choose **Approve** or **Request changes**.
6. If changes are required, edit the draft and submit it again.

**Expected result:** An approved certificate is eligible for issuance. Approval requires the attending doctor's verified license status and recorded license number.

### 11.2 Doctor or receptionist: issue

1. Open the approved certificate.
2. Verify the patient, consultation, physician, and certificate content.
3. Select **Issue certificate** and confirm.
4. Use the print or PDF action available on the issued certificate.

**Expected result:** The issued certificate becomes read-only and is retained in the patient's medical history. A receptionist can issue an approved certificate; clinical creation and approval remain with the authorized attending doctor.

### 11.3 Void an issued certificate

An administrator or the attending doctor can use **Void** on an issued certificate when permitted. Enter the required reason and confirm. The voided certificate remains in the history; it must not be treated as a valid issued certificate.

## 12. Document tracking and release

### 12.1 Review and mark ready

1. As an authorized receptionist or administrator, open **Document Management**.
2. Find the patient's document and check the appointment and type.
3. Select **Review report details** and review the document.
4. For an approved document, select **Mark ready** or **Mark examination report ready** when permitted.

**Expected result:** The document is marked **Ready for pickup**. The staff member marking it ready must have performed the required review.

### 12.2 Record release

1. Open the ready document and select **Record release** or **Release examination report**.
2. Answer whether the recipient is an authorized representative. For a representative, enter the full name and identity or authorization verification details.
3. Enter optional remarks and complete the release prompts.
4. Check that the record shows **Released**.

**Expected result:** The release is recorded with its audit information. Follow the clinic's identity checks and the instructions displayed to the patient.

### 12.3 Reverse an incorrect release

Only an authorized administrator can reverse a released document. Open the record, select **Reverse** or **Reverse report release**, enter the required reason, and confirm. Review the resulting status before making a corrected release entry.

The doctor also has a separate **Release final report** action after clinical finalization. Follow the relevant module's prerequisites; a completed examination does not by itself establish that every document has been released.

## 13. Understanding statuses

### 13.1 Appointment statuses

Not every visit passes through every status. The selected services and required verification determine the route.

| Status | Meaning and next step |
| --- | --- |
| Pending Approval | The request awaits clinic review. |
| Confirmed | The request is accepted; review the approved schedule. |
| Arrived | Attendance or arrival has been recorded. |
| For Diagnostics | Requested diagnostic services remain in progress. |
| For X-Ray | The visit is awaiting its X-ray workflow. |
| Awaiting X-ray Result | The X-ray result is still pending. |
| Verifying Drug Test Result | The drug-test result requires verification. |
| Verifying X-Ray Result | The X-ray result requires verification. |
| Verifying Drug and X-Ray Test Result | Both verification workflows are pending. |
| For Final Evaluation | The encounter awaits the doctor's final evaluation. |
| Completed | The encounter has reached clinical completion; check release separately. |
| Rejected | The clinic declined the request; review the reason or contact the clinic. |
| Cancelled | The booking is no longer active; contact the clinic if another visit is needed. |

### 13.2 Certificate and document statuses

| Record | Common progression |
| --- | --- |
| Medical certificate | Draft → Pending approval → Approved → Issued; changes may be requested before approval, and an issued certificate may be voided. |
| Tracked medical document | Processing → For review → Approved → Ready for pickup → Released; cancelled or voided records may also appear. |
| Laboratory or X-ray report | Draft → Completed/finalized; some results require verification before completion. |

## 14. Account settings and security

Open the profile menu or **Settings** to see the controls available to your role.

### 14.1 Update your profile or password

Review your profile, edit the permitted fields, and save. Follow any new email verification prompt. Where password settings are available, enter the current password, enter and confirm the new password, and submit. Receptionist settings have different access restrictions; contact administration if a needed setting is unavailable.

### 14.2 Enable two-factor authentication

1. Open the two-factor authentication settings when available.
2. Confirm your password if requested.
3. Begin setup and scan the QR code with your authenticator application.
4. Enter the requested code to complete setup.
5. Save the recovery codes in a secure place separate from your login device.

**Expected result:** Future logins require the additional code. Use a recovery code if you lose access to your authenticator, or contact the administrator if recovery is unavailable.

### 14.3 Professional credentials

Doctors, MedTechs, and RadTechs can use the permitted profile controls to submit signatures and license documents. Follow the displayed file requirements. Administrative verification may be required before credential-dependent actions become available.

### 14.4 Sign out and protect records

Use **Log out** in your profile menu and confirm if prompted. Sign out after using a shared device. Keep passwords, verification links, recovery codes, medical records, employee spreadsheets, and downloaded reports accessible only to authorized people.

## 15. Troubleshooting

| Problem | Recommended action |
| --- | --- |
| Login fails | Check the email and password, use password recovery, and contact administration if the account is inactive. |
| Verification email is missing | Check spam, confirm the email address, and use the resend action. Allow time before another request. |
| Invitation or reset link is expired | Request a fresh link through the relevant recovery or clinic process. |
| Registration reports matching patient details | Recover the existing account or ask the clinic to review the match. |
| Booking is blocked by an existing appointment | Open the active appointment and contact the clinic if it needs cancellation or correction. |
| No available dates, doctors, or times | Select another offered date or contact the clinic to check availability. |
| A form will not submit | Read the validation messages, correct highlighted fields, and submit once. |
| Spreadsheet preview shows invalid or duplicate rows | Use the latest template, correct the flagged data, and upload it again before confirmation. |
| Bulk approval is blocked | Check confirmed employee enrollment, event dates, and all required staff assignments. |
| Patient or event is absent from a staff queue | Clear filters and check the date, attendance, assignment, selected service, and workflow status. |
| Final evaluation is blocked | Resolve the incomplete services and verification items listed on the evaluation page. |
| A clinical result cannot be edited | It may be finalized or locked. Ask an authorized administrator to review the correction. |
| Certificate approval is unavailable | Check the certificate status, attending physician, license number, and license verification. |
| Patient report download is unavailable | Check the correct appointment and its completion and release requirements; contact the clinic. |
| Company report download is unavailable | Confirm that the clinic generated and released the report to the owning company. |
| Mark ready is unavailable | Check that the document is approved and that you reviewed its details. |
| Access denied appears | Verify that you are using the correct account and assignment. Ask administration to review access. |
| Too many attempts message appears | Wait for the indicated period before retrying. Avoid repeated submissions. |
| Forecast or weather panel fails | Retry later and report the issue so administration can check the supporting service. |
| A session expires during work | Sign in again, check whether the last save succeeded, and review the record before re-entering data. |

When reporting a problem, provide your role, the page, the record reference, the time, the action attempted, and the exact error message. Exclude passwords, recovery codes, and unnecessary medical information.

## 16. Quick reference and glossary

### 16.1 Routine workflows

| Workflow | Typical sequence |
| --- | --- |
| Individual patient | Register and verify → Request appointment → Clinic approval → Arrival and intake → Requested services → Final evaluation → Authorized release. |
| Company bulk event | Request event → Confirm master-list import → Administrative approval and staffing → Attendance → Employee services → Resolve completed/absent employees → Generate, review, and release company report. |
| Medical certificate | Doctor drafts → Submits → Attending physician approves → Doctor or receptionist issues → Authorized print or PDF access. |
| Document handover | Staff review → Mark ready → Record recipient and release → Check release history. |

### 16.2 Terms

| Term | Meaning |
| --- | --- |
| APE | Annual Physical Examination. |
| PE | Physical Examination. |
| CBC | Complete Blood Count. |
| MedTech | Medical Technologist. |
| RadTech | Radiologic Technologist. |
| Parent bulk event | The company group booking that contains employee appointments. |
| Master list | The employee spreadsheet used for registration and enrollment. |
| Draft | A saved record that has not completed its finalization or approval workflow. |
| Finalization | Clinical completion that locks a result or encounter against ordinary staff editing. |
| Release | A separate authorized action that records or enables delivery of a report or document. |
| Audit trail | The recorded history of actions and changes. |
| 2FA | Two-factor authentication, using a second login verification step. |

### 16.3 Related project guides

- [Backup and Recovery](BACKUP_RECOVERY.md): operational backup and restoration procedures.
- [User Acceptance Checklist](UAT_CHECKLIST.md): checks for confirming system behavior before rollout.
- [Company Bulk Appointment Test Guide](COMPANY_BULK_APPOINTMENT_TEST.md): detailed bulk workflow validation.

**Document maintenance:** Update this manual when the system's menus, forms, permissions, or workflows change. Before distributing it for a specific deployment, have the clinic owner verify the system address, configured hours, local release procedures, and support contact information.
