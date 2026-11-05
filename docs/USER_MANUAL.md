# LMIC Medical Services Management System

## User Manual

**Living Myth Industrial Clinic**  
Version 1.2 | Updated November 3, 2026
Coverage: Guest/Public Pages, Patient, Company, Receptionist, Doctor, MedTech, RadTech, and Administrator

This manual describes the workflows implemented in the current project. Available actions depend on your account role, assignments, record status, and clinic configuration. It was prepared from the application source and project documentation; live screen walkthroughs and screenshots are not included.

**Printed results are collected at the clinic.** Patients use the system to request appointments and track document processing and collection status. Patient accounts cannot download clinical report PDFs. A doctor's **Forward to clinic reception** action completes the clinical handoff; reception records the actual collection separately.

## Contents

1. About the system
2. Guest/public pages and getting started
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
| Guest (no account required) | Browse clinic information and services, send an inquiry, and open registration or login. |
| Patient | Register, request an appointment, track a visit and document status, and collect printed results at the clinic. |
| Company | Refer employees, upload employee master lists, request bulk appointments, and download released company reports. |
| Receptionist | Review individual appointment requests, manage the clinic queue, record intake vital signs, handle assigned bulk attendance, and perform authorized document release. |
| Doctor | Examine assigned patients, review results, complete final evaluations, manage medical certificates, and request availability changes. |
| MedTech | Record and finalize requested laboratory services for authorized patients. |
| RadTech | Record and finalize requested X-ray findings for authorized patients. |
| Administrator | Manage accounts, companies, appointments, availability, staffing, reporting, security, backups, and authorized corrections. |

### 1.2 Before you begin

Use an internet-connected device and a current web browser. Obtain the system address from the clinic. Patients need access to their registered email; staff and company users need the credentials or invitation supplied by the clinic.

Default clinic hours in this project are Monday to Friday, 8:00 AM to 5:00 PM, Philippine time. The available dates and times shown in the booking form determine what you can select. Doctor availability and existing appointments can reduce the available slots.

### 1.3 Start with your role

| Your account | Read first | Main workspace |
| --- | --- | --- |
| Guest / visitor | Section 2.1 | Public home page and Send an Inquiry |
| Patient | Sections 2–4 and 12 | Home and My appointments |
| Company representative | Sections 2–3 and 5 | Overview, Employee Records, Bulk Appointments |
| Receptionist | Sections 2–3, 6, and 12 | Queue Management, Appointment Requests, Document Management |
| Doctor | Sections 2–3, 7, 11, and 14.3 | Appointments, Patient Records, Medical Certificates |
| Medical technologist | Sections 2–3, 8, and 14.3 | Medtech Queue |
| Radiologic technologist | Sections 2–3, 9, and 14.3 | Radtech Queue |
| Administrator | Sections 2–3, 10, and 12–14 | Management, Appointments, Security, Data Management |

**Training example:** An appointment reference such as `APT0001` identifies a visit. A report reference identifies an examination record. Neither reference replaces checking the patient's identity before an action.

## 2. Guest/public pages and getting started

### 2.1 Guest/public pages

A guest is a visitor who has not signed in. You do not need an account to browse the clinic's public home page or send an inquiry. Open the system address supplied by the clinic. If you are already signed in, the home address opens your role's workspace; sign out to view the guest page.

**Browse the home page**

1. Open **About**, **Services**, or **Contact** in the top navigation, then select the relevant item. On desktop, hover over or focus a menu to reveal its links. On a phone or narrow screen, select the menu button, expand a category, and choose a link.
2. Use the following public sections to find information. Links to sections move you to that part of the same page.

| Menu or section | What a guest can do |
| --- | --- |
| About the Clinic | Read the clinic overview and information about its care and facilities. |
| Clinic Gallery | Browse clinic photos with the previous/next arrows or photo indicators. |
| Frequently Asked Questions | Select a question to expand its answer; select it again to collapse it. |
| Medical Services | Read about pre-employment examinations, annual physical examinations, drug testing, laboratory and diagnostic services, and vaccination programs. |
| Corporate Programs | Review workplace medical programs and contact the clinic about company needs. |
| Clinic Location / Contact | Find the displayed address, contact number, email, clinic hours, and location map. |
| Footer links | Open public sections, account entry points, **Terms**, **Privacy Policy**, or **Data Deletion** information. Use the displayed phone, email, or Facebook links to contact the clinic through your device's supported apps. |

**Expected result:** You can learn about the clinic and choose the appropriate next step. Public service descriptions and FAQs are general information; confirm the required service, current availability, and expected result-processing time with the clinic.

**Start booking or sign in**

- Select **Book a consultation** to open patient registration. Complete registration and verification as described in Section 2.2, then request an appointment using Section 4. The public button does not create a confirmed booking by itself.
- Select **Login** or the footer's **Sign In** link if you already have an account. See Section 2.3 for sign-in steps and Section 2.5 for password recovery.
- Guests must sign in with an eligible account before accessing appointment booking and private records. Staff and company accounts are created through clinic administration.

**Send an inquiry without an account**

1. Choose **Contact > Send an Inquiry**, or use **Send an Inquiry** in the contact section or footer.
2. Select the appropriate category: **General Inquiry**, **Medical Services**, **Appointment Concern**, **Company Services**, **Company Account Inquiry**, **Bulk / Onsite Medical Services**, **Company Referral Services**, **Technical Concern**, or **Other**.
3. Enter your first and last names, optional middle name, and email address. Complete any other fields requested on the form.
4. For company-related categories, review the company information fields. **Company Account Inquiry** requires the company name and company contact number; representative position/job title is optional.
5. Enter a **Subject** of up to 150 characters and a **Message** of up to 5,000 characters. Do not include passwords, medical records, or sensitive clinical results.
6. Select **Send Inquiry** and wait for the success message. Correct any displayed validation errors before submitting again. If too many submissions are attempted, wait before retrying.

**Expected result:** The inquiry is submitted for clinic review, and the form displays confirmation. Check the email address you supplied for the clinic's reply. Guests do not have access to the signed-in inquiry history. A company account inquiry is a request for review; submitting it does not automatically create an account, approve a company partnership, or book an appointment. Select **Cancel** or the back link to return to the public home page.

### 2.2 Register a patient account

1. Open the clinic's system address and choose the registration option.
2. Enter your first and last names and your middle name, if applicable.
3. Enter your email address and a valid Philippine mobile number.
4. Complete your birthdate, sex, civil status, and address.
5. Create a password and enter the same password in the confirmation field.
6. Complete the required acknowledgments displayed on the page and submit the form.
7. Open the verification email and follow its link. If prompted, sign in to finish verification.

**Expected result:** You can access the patient portal after satisfying verification and profile requirements. Self-registration requires the patient to be at least 18 years old. If the system detects matching patient information, use your existing account or account recovery.

Passwords must contain at least eight characters and at least three of these four categories: uppercase letters, lowercase letters, numbers, and symbols.

### 2.3 Sign in

1. Open the login page.
2. Enter your registered email and password.
3. Submit the login form.
4. If two-factor authentication is enabled, enter an authenticator code or use a recovery code.
5. Complete any email verification, temporary password, or patient profile prompt.

**Expected result:** The system opens the workspace assigned to your role. Google or Facebook sign-in may also be available when configured by the clinic. Complete any additional email or profile information requested after social sign-in.

### 2.4 First login for staff and company accounts

Use the credentials or invitation sent by the clinic. If directed to change a temporary password, enter and confirm a new password before proceeding. Contact the administrator if the invitation or credentials are missing or no longer work.

Staff and company roles are provisioned through clinic administration; patient registration does not create these roles.

### 2.5 Recover a forgotten password

1. Select the password recovery option on the login page.
2. Enter your registered email address and request a reset link.
3. Check your inbox and spam folder.
4. Open the reset link and enter and confirm a new password.
5. Return to the login page and sign in.

**Expected result:** The new password replaces the previous password. Request a new link if the previous link has expired.

### 2.6 Recover a locked account

After five failed sign-in attempts, the account is locked. Use **Forgot password** and complete password recovery to unlock it. Waiting alone does not clear an account lock. A temporary rate-limit message may also require waiting for the displayed countdown. Contact administration if the account is inactive or you cannot access its email.

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

On desktop, the staff sidebar expands when hovered over or reached with the keyboard. Use its lock/unlock control to keep it expanded or allow it to collapse. On mobile, use the menu button. Page content and floating report actions adjust to the sidebar. Read the record title before confirming a floating action.

## 4. Patient instructions

### 4.1 Review your health overview

Sign in and open **Home** or your health overview. Review the appointment information and notices shown. Open the relevant visit to see its current status and available records.

### 4.2 Book an appointment

1. Open **My appointments** or **Appointments** and choose the booking option.
2. In **Visit**, choose the visit type and examination purpose offered to your account.
3. Select the required services. Where a package supplies services automatically, review the included items. Select the referring company when required.
4. In **Schedule** (shown as **Time** in the progress indicator), use the enabled doctor/date/time controls. For a consultation, choose the doctor first, then an available date and time.
5. Check the patient identity and profile information shown. Complete a missing-profile prompt before booking if required.
6. In **Review**, verify the purpose, services, patient information, and schedule.
7. Select **Confirm booking** and wait for the confirmation step.
8. Save the appointment reference and check the appointment list for its current status.

Use **Home > Book appointment** or **My appointments > New Appointment** to start. The current progress indicator is **Visit > Schedule > Review > Confirmation**; the schedule may also use the short label **Time**.

| Purpose | What to do |
| --- | --- |
| Pre-employment | Review the automatically included Basic 5: PE, CBC, Urinalysis, Fecalysis, and X-ray. Choose permitted extra services only when required by the employer or clinic. |
| Medical Consultation / Certificate Request | Consultation and examination are included. The doctor requests additional tests if needed. A certificate is subject to the doctor's assessment; booking does not guarantee one. |
| Annual Examination | Follow the company bulk-booking process. Do not use a personal consultation request to represent a company annual event. |

**Expected result:** The request appears as **Pending Approval** until authorized clinic staff accept or reject it. Submission is not clinic approval; wait for the confirmed status before treating the requested schedule as accepted.

The current system limits patients to one active or pending appointment at a time. If booking is blocked by an existing appointment, open that record and contact the clinic if it needs cancellation or correction. Select another available slot if the chosen slot becomes unavailable before submission.

### 4.3 Track an appointment

1. Open **My appointments**.
2. Use the available filters to locate the visit.
3. Open the appointment and check its reference, schedule, services, and status.
4. Check notifications for approval, rejection, reminders, or changes.

If you need to cancel or change a visit, contact the clinic with its reference number. This manual does not assume a patient self-service cancellation or rescheduling button.

### 4.4 Track documents and collect printed results

1. Open the relevant appointment.
2. Review the available medical record cards or follow the link to your medical documents.
3. Check the document status and release instructions.
4. Select **Track release status** to open your medical document tracking page.
5. Wait for **Ready for pickup**, then visit the clinic and follow its identity or authorized-representative requirements.
6. Receive the printed results from authorized clinic personnel. Staff record the physical handover in the system.

**Expected result:** You can track only your own documents. Clinical report PDFs are not downloaded or delivered to patient accounts. An appointment marked **Completed** means the clinical work is complete; it does not mean that a printed document is ready or has been collected. **Released** on the document tracking page means staff have recorded its physical handover.

### 4.5 Send and track an inquiry

Open the inquiry form from the available clinic links, complete the requested contact information, category, subject, and message, then submit it. Signed-in users can open **Inquiries** to review their inquiry history. Check the registered email for the clinic's reply.

## 5. Company instructions

### 5.1 Review the company workspace

Open **Overview** to review employee totals, upload history, referrals, and available reports. Use **Employee Records** for the company-facing employee list and **Bulk Appointments** for group booking requests.

Company accounts see the employee and appointment information authorized for their own company. They do not receive general access to every personal appointment of an employee. Authorized company-referral reports and released company bulk reports have separate access rules; use only the report links actually offered to your company account.

### 5.2 Create an employee referral

1. On **Overview**, select **Create employee referral**.
2. Enter the employee's first name, last name, and email.
3. Choose the available purpose, such as pre-employment or medical certificate.
4. Review included services and permitted extras, then select **Create referral**.
5. Ask the employee to check the invitation email and follow its instructions.

**Expected result:** The employee receives a referral invitation. The employee can follow the invitation, sign in or register as needed, and continue the linked booking process. Contact the clinic if an invitation has expired or contains incorrect information.

Track the referral under **Individual referrals**. For an eligible unused referral, select **Cancel**, enter the **Cancellation reason**, and confirm. The employee uses **Login or register to continue**, then **Continue to appointment**; the referral's company and required services remain attached to that booking.

### 5.3 Request a bulk appointment

1. From **Overview** or **Bulk Appointments**, select **Book bulk appointment**.
2. Review the Annual Physical Examination purpose and select the services offered.
3. Choose the offered clinic or onsite location option. Enter an onsite address when required.
4. Enter the expected employee count and preferred event start date. Review the representative contact name and number supplied from the company account; they are read-only here. Correct profile information or contact the clinic if they are wrong.
5. Review the request and submit it.
6. Upload and confirm the employee master list for this bulk appointment.
7. Track the request under **Bulk Appointments** and review the final approved dates.

**Expected result:** A parent bulk event is created. Administration determines the final approved schedule, duration, and required staff. The preferred start date is a request until approval.

The service setup choices are **Onsite at company** and **At LMIC clinic**. Partnered-company annual examinations must meet the minimum booking date shown, which is at least one month ahead when that policy applies.

### 5.4 Upload an employee master list

1. Obtain the current master-list template from the clinic. A signed-in company user can also open the system address followed by `/company/employees/import/template` to download it.
2. Keep the template headings unchanged: `first_name`, `middle_name`, `last_name`, `sex`, `birthdate`, `civil_status`, and `employee_number`. First name, last name, sex, birthdate, and civil status are required. Middle name and employee number are optional. The template does not require email or phone columns. Use dates such as `2026-01-31` and a supported sex value such as Male or Female.
3. Open the spreadsheet upload panel and select the appropriate bulk appointment when enrolling employees in that event.
4. Choose an XLSX, XLS, or CSV file of no more than 10 MB.
5. Select **Preview employee records** and inspect the **Total**, **Ready**, **Invalid**, and duplicate summaries.
6. Use **Upload another file** to replace an incorrect preview. Correct the source file as needed. A preview expires after 30 minutes.
7. Select the confirmation control showing the counts of new and existing employees only after checking the intended event and rows.
8. Review the imported employee count and event association.

**Expected result:** Validated employees are registered or associated with the selected program. Previewing a spreadsheet does not complete enrollment; confirmation is required. Employee import does not provide employee passwords to company users.

Use **Bulk Appointments > Upload masterlist** for event enrollment, or **Overview > Upload employee Excel file**. **Import employees only** does not enroll employees in an event. Invalid rows are excluded; existing employees can be associated without creating duplicate people. Review **Recent uploads** and the import-result **Error report** after confirmation. Imported employee records do not automatically receive usable patient-portal credentials.

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
4. Select **Accept request**, review **Accept appointment request?**, then confirm **Accept request**. Acceptance uses the reservation already shown; this dialog does not assign another doctor or schedule.
5. To reject, choose **Reject request**, select **Reason**, complete **Additional details** when required, then confirm. Details are required for **Other**.
6. Use **Send reminder** or **Resend reminder** when available and appropriate.

**Expected result:** An accepted request appears as **Confirmed**. Rejection updates the request status and triggers the corresponding notification workflow.

### 6.2 Register a walk-in patient

1. Open **Queue Management > New walk-in**.
2. Choose **Existing patient** and search using at least two characters before creating another patient record.
3. Select the matching patient, or use **Register new patient** and complete the required identity fields.
4. Enter the visit purpose and use **Assign services**.
5. Choose an offered doctor and time, or **Wait for a free doctor** when no slot is being assigned yet.
6. Select **Add to queue** and confirm that the visit appears.
7. For an unassigned visit, use **Assign doctor**, choose a free doctor/time, and save before starting processing.

**Expected result:** The visit is recorded in the clinic workflow. Check patient identity carefully to avoid duplicate records or attaching a visit to the wrong patient.

Walk-ins wait first come, first served while approved reservations remain protected. Weekend walk-in registration is unavailable in the current interface.

### 6.3 Record intake vital signs

1. After check-in, open the eligible individual visit and select **Record Vital Signs**.
2. Complete the required measurements using the displayed units: blood pressure, heart rate, respiratory rate, temperature, oxygen saturation, height, weight, visual acuity, and hearing as required by the form. BMI is calculated automatically.
3. Complete any additional measurements and notes that were actually observed.
4. Select **Save Vital Signs**.
5. For a doctor's repeat request, choose **Recheck Vital Signs**. For another correction, use **Add New Measurement**. Select **Save New Measurement** and review **Measurements this encounter**.

**Expected result:** The measurement is saved with its history. The doctor can review intake values without overwriting the original entry. Follow the form's permitted workflow for rechecks and corrections.

Saving a requested recheck resolves the pending request. These receptionist vital-sign routes are for eligible individual patient visits, not bulk employee appointments.

### 6.4 Manage the clinic queue

Use **Queue Management** to locate today's patients, review doctor assignments and available times, and apply the status actions allowed by the page. Check the saved status before directing the patient to the next department.

For an accepted online visit, choose **Mark Arrived** after the patient checks in. An individual request must first be accepted. Eligible company referrals also expose **Mark Arrived**. For walk-ins, use **Start processing** after assigning a doctor/time; this action becomes available at the assigned time. This walk-in time restriction is distinct from the scheduled clinic doctor's PE date check.

Receptionists handle intake and operational information. Clinical findings, laboratory interpretation, and final medical classifications belong to the authorized clinical roles.

### 6.5 Record bulk attendance

1. Open **Bulk Attendance**.
2. Select an assigned event and choose **Manage attendance** during its scheduled event window.
3. Find the employee in that event's master list and verify their identity.
4. Choose **Arrived** or **Absent**, read the identity confirmation, and confirm only after checking the correct employee.
5. Check the saved attendance and direct arrived employees to the required services.

**Expected result:** Arrived employees become eligible for the appropriate event queues. An absent employee remains recorded as absent and does not need a completed examination to resolve the event.

An employee marked absent cannot simply be marked arrived again through the same receptionist controls. Ask administration to review a mistaken attendance entry.

## 7. Doctor instructions

### 7.1 Open your assigned patients

Review **Dashboard** and **Appointments** for clinic visits. For an assigned company event, open **Onsite Events** and its departmental queue. Use **Patient Records** to find authorized patient history. Confirm the patient and appointment before entering clinical information.

Before conducting examinations, complete professional license verification in Section 14.3. An active account, an assigned patient, and an **Arrived** appointment do not override an unverified license.

### 7.2 Record a physical examination

1. In **Appointments**, locate the assigned patient and select the play-icon action with tooltip **Start Physical Exam**. This is the conduct-PE action. Consultation requests may instead offer **Consultation**, followed by **Certificate** after an examination exists.
2. Review patient identity, selected services, medical history, and intake measurements.
3. Open the floating **Recorded vital signs** panel. Select **Request recheck** and enter a reason if reception must repeat a reading. Use **View repeated readings** to inspect the history. Routine intake belongs to reception; urgent continuation without measurements requires the permitted **Urgent override reason**.
4. Complete the history, examination findings, and remarks required by the form.
5. Select **Save examination** and check that the record was saved.

**Expected result:** Examination findings are available for the encounter's review and final evaluation. Saving the examination alone does not release a final medical report.

For consultation/certificate requests, use **Additional services, only if needed** to request clinically indicated tests. Existing requests cannot be removed. Saving directs the consultation to certificate preparation; requested services enter their department queues. A new laboratory request can reopen a finalized laboratory report while preserving existing values. Pending drug-test verification blocks additional laboratory requests; wait for the responsible MedTech to complete that workflow.

For an ordinary scheduled clinic visit, the patient must be assigned to you, scheduled for today, checked in, and not already completed. Your professional license must be verified. The queue checks the appointment date; it does not wait for the scheduled clock time. A missing **Conduct PE** button should be investigated using those prerequisites, not by creating another booking.

### 7.3 Complete the final evaluation

1. Open **Final Evaluation** for the correct appointment. The screen uses the **Medical Examination Report** template.
2. Check the selected-services summary and incomplete-service notices.
3. Review the physical examination and requested laboratory and X-ray results.
4. Resolve any outstanding service requirements with the responsible department. Drug-test verification and finalization belong to the responsible MedTech; the doctor reviews the result after completion.
5. Review the report's patient information, medical history, physical findings, laboratory summary, X-ray summary, and other requested services. Expand **Supporting laboratory and diagnostic results** for the full recorded values. **Not requested** is different from **Pending**.
6. Select the medical classification and complete **Final diagnosis**, **Final remarks**, and **Recommendations** as required.
7. Select the floating **Issue final evaluation** button when all required services and verification are complete.
8. Check the **Medical Examination Report finalized** notice. Ordinary clinical editing is now locked.
9. Select **Forward to clinic reception** in the floating panel and confirm the handoff.
10. Wait for the success message and return to **Doctor Queue**. Reception handles review, pickup readiness, and physical collection through **Document Management**.

**Expected result:** Finalization locks the encounter's clinical records. Forwarding completes the clinical handoff to reception; it does not deliver a PDF to the patient or record physical collection. The patient receives a status notification and must visit the clinic when the printed report is ready. Contact administration if a finalized record needs correction. Notifications are processed in the background, so delivery may follow the successful handoff.

### 7.4 Request an availability change

1. Open **Availability**.
2. Use **Set Weekly Availability**, enable the appropriate working days, and enter **Start Time** and **End Time** in the offered 30-minute increments.
3. Select **Save Availability** and check the request status.
4. Confirm the final schedule after administrative review.

**Expected result:** The proposal enters the availability approval workflow. Do not treat a submitted request as an approved schedule change.

For certificate creation and approval, follow Section 11.

## 8. Medical technologist instructions

1. Open **Overview** and **Medtech Queue**, or the departmental queue in an assigned **Onsite Event**. Select **Encode Lab** for a new report or the edit-result control for an existing one.
2. Select the correct patient and appointment.
3. Check which laboratory services were requested.
4. Enter results in the displayed sections using the specified units and reference information.
5. Where shown, choose **Clinical interpretation > Normal** or **With findings**. Supply **Findings** for a with-findings interpretation, and add optional **Laboratory remarks**.
6. Use **Save draft** while the report is incomplete; reports including Drug Test can show **Save as Pending**.
7. When a positive or pending drug-test result requires verification, select **Send Drug Test for Verification**. Do not directly finalize a positive result to bypass verification. The responsible MedTech records verification progress with **Save Verification Update**, then completes the offered finalization action after reviewing the official result. Other laboratory sections remain protected during verification updates.
8. Review the completed report, choose **Finalize Laboratory Report** when displayed, and confirm. Drug-test workflows may offer different completion or verification actions; use the action corresponding to the actual result state.

**Expected result:** Finalized services are marked completed and become read-only. A pending verification step must be resolved before the encounter can finish. Ask an administrator to handle a necessary correction after finalization.

Laboratory sections depend on the selected services. The eight supported forms are **Complete Blood Count**, **Urinalysis**, **Fecalysis**, **Drug Test**, **Hepatitis B Screening**, **Pregnancy Test**, **Blood Chemistry**, and **Blood Type**. Pregnancy testing is displayed only when applicable to the patient and requested services. PE and X-ray use separate clinical forms.

Verify your professional license before encoding or finalizing clinical results. Never enter invented values to bypass a required field, and do not treat the reference range indicator as a substitute for the authorized clinical interpretation.

## 9. Radiologic technologist instructions

1. Open **Overview** and **Radtech Queue**, or the departmental queue in an assigned **Onsite Event**. Select **Start** or the existing report's edit action.
2. Select the patient, confirm that X-ray is requested, and choose the **Result classification**: **Normal study** or **With findings**.
3. **Normal study** supplies the standard findings and impression. **With findings** permits entry of **Radiographic findings** and **Impression**. Add **Technologist notes** and an optional **Recommendation** as appropriate.
4. Choose **Save draft** if the report is incomplete or still being reviewed.
5. If a saved report exists, use **Preview PDF** when offered to review it. Check findings and impression before finalization.
6. Review the findings and impression, select **Finalize X-Ray**, and confirm.

**Expected result:** The X-ray service becomes completed and read-only after finalization. Contact administration if a finalized report needs correction.

The RadTech's professional license must be verified. Use **Save draft** until official findings are available. **Finalize X-Ray** verifies and completes the report; there is no separate RadTech verification button in this form.

## 10. Administrator instructions

### 10.1 Review daily operations

Open **Dashboard** for the operational overview. Use **Appointments > Today's Clinic Overview** to inspect the day's clinic workload and **Appointments > Appointments** to search and manage individual visits.

### 10.2 Manage staff

1. Open **Management > Staff**.
2. Select **Add Staff** for a new account or edit an existing record.
3. Complete identity, email, contact, role, and relevant professional information.
4. Use **Create Staff Account** or **Save Changes** and check the active status. **Deactivate** prevents normal access; **Activate** restores an eligible account. Self-deactivation is blocked.
5. Use **Resend temporary credentials** when a staff member needs a fresh initial-login message.
6. Review professional license documents using the preview steps below and update license verification where appropriate.
7. Manage signatures through the authorized controls.

**Expected result:** The staff member receives the role and access you assigned. Check the selected role before saving. Deactivating an account prevents its normal active-account access.

To review PRC proof before downloading:

1. Edit the doctor, MedTech, or RadTech account and scroll to **Credential Review > Professional License**.
2. Select **View proof** after both license images have been submitted. The front and back images appear in a popup; review both sides.
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

For a recurring schedule, use **Add period** and **Save schedule**. Under **Pending availability requests**, compare **Current approved availability**, the requested schedule, and **Potentially affected appointments**, then choose **Accept request** or **Reject**. Accepting a change can reschedule affected appointments; acceptance is blocked if the system cannot find valid replacement slots within its configured search window. Confirm the resulting schedule and patient communications.

### 10.8 Handle inquiries

Open **Management > Inquiries**, filter and open the inquiry, read the message, send the appropriate reply, and update its status. For a relevant company inquiry, use the create-company action when offered.

### 10.9 Review analytics and disease simulation

Use **Analytics > Analytics dashboard** for patient-volume information and available forecasts. Use **Analytics > Disease simulation** for the monthly simulation, experimental weather scenario, and synthetic resource-planning views.

Select the period or scenario controls offered, wait for loading to complete, and read the displayed source and limitation notices. Disease simulations and synthetic resource scenarios support planning; they do not establish patient diagnoses or measured clinic demand. If weather or forecasting services are unavailable, report the issue and consult the data that remains available.

### 10.10 Review security information

Open **Security**, review the displayed alerts and audit information, and use **Download logs** when a copy is needed for authorized review. Protect downloaded logs and share them only with authorized clinic personnel.

This page is for alerts and **Security Logs**. It does not provide a general account-blocking or security-policy editor; manage account activation in the relevant staff or account-management screen.

### 10.11 Manage backups and retention

1. Open **Data Management**.
2. Review the current retention settings and the summary of affected records.
3. Edit the policy or scheduled backup options when authorized, then select **Save policy**.
4. To make an immediate backup, select **Create manual backup**.
5. Check the backup history for a successful status and use **Download** when available.
6. Use **Run retention now** only after reviewing the affected data and confirming that permanent deletion is intended. This control is unavailable when no records qualify.

**Expected result:** Backup creation is recorded in the backup history. Retention enforcement creates a backup before deleting eligible data, but deletion is permanent in the active system. Restoration is an operational procedure described in the separate Backup and Recovery guide.

The policy controls include **Medical record retention (years)**, **Inactive account retention (months)**, **Automatic six-month backups**, and **Automatic permanent deletion**. Automatic permanent deletion is not enabled merely by creating a backup. Treat enabling it or running retention as a deliberate administrative decision.

## 11. Medical certificates

Medical certificates use a dedicated approval and issuance workflow. Creating a certificate, approving it, issuing it, and releasing a tracked document are distinct actions.

### 11.1 Doctor: create and approve

1. Open **Medical Certificates** and choose the create action.
2. Find the correct patient and select the relevant consultation when required.
3. Complete the certificate form and review its preview.
4. Before approval, confirm that the linked consultation and every additionally requested service are complete.
5. Select **Save draft** for unfinished work or **Save and approve** when the certificate is complete and justified.
6. If an approved, unissued certificate needs correction, use the permitted return-for-changes action and provide the reason. Correct the record and approve it again. Already issued certificates cannot be edited normally.

The form includes **Related consultation**, **Reason for consultation**, **Clinical impression**, **Recommendation**, applicable rest dates, the attending physician, and certificate date. Review any prefilled information and the displayed service-completion checks. The physician's license number comes from the verified staff account. On an existing eligible draft or returned certificate, the attending physician can also use **Approve** and confirm.

**Expected result:** An approved certificate is eligible for issuance. Approval requires the attending doctor's verified license status and recorded license number.

### 11.2 Attending doctor: issue; reception: print and arrange pickup

1. Open the approved certificate.
2. Verify the patient, consultation, physician, and certificate content.
3. Select **Issue certificate** and confirm.
4. Confirm the issued status and the linked appointment's completed status.
5. Receptionists can use the permitted print or PDF action for an issued certificate and complete the separate document review and pickup process in Section 12.

**Expected result:** Only the attending doctor with a verified professional license can issue the certificate. Approval alone does not issue it. Issuance locks the certificate and completes its linked certificate-request appointment. Receptionists print issued certificates and record physical pickup; they do not approve or issue certificates.

### 11.3 Void an issued certificate

An administrator or the attending doctor can use **Void** on an issued certificate when permitted. Enter the required reason and confirm. The voided certificate remains in the history; it must not be treated as a valid issued certificate.

Use **Reason for voiding certificate > Confirm void**. Before issuance, an eligible correction instead uses **Request changes > Changes required > Send correction request**. Follow the minimum reason length and validation displayed.

## 12. Document tracking and release

### 12.1 Review and mark ready

1. As an authorized receptionist, open **Document Management**. Administrators use **Management > Document Management**.
2. Find the patient's document and check the appointment and type.
3. Select **Review report details** and inspect the PDF opened for authorized staff in a new tab. Return to the document list afterward; **Review details again** can be used for another inspection.
4. For an approved document, select **Mark ready** or **Mark examination report ready** when permitted.

**Expected result:** The document is marked **Ready for pickup**. The same signed-in staff member marking it ready must have performed the required review; another staff member's review does not unlock the action. Medical certificates must also be issued before pickup readiness and release.

### 12.2 Record release

1. Open the ready document and select **Record release** or **Release examination report**.
2. Answer whether the recipient is an authorized representative. For a representative, enter the full name and identity or authorization verification details.
3. Enter optional remarks and complete the release prompts.
4. Check that the record shows **Released**.

The configured method is **Physical pickup at clinic**. For a representative, complete **Representative full name** and **Identity/authorization verification details**. Complete **Remarks (optional)** if needed. Check **Release history** afterward. Do not record a handover while the document is merely being prepared.

**Expected result:** The release is recorded with its audit information. Follow the clinic's identity checks and the instructions displayed to the patient.

### 12.3 Reverse an incorrect release

Only an authorized administrator can reverse a released document. Open the record, select **Reverse** or **Reverse report release**, enter the required reason, and confirm. Review the resulting status before making a corrected release entry.

The reversal prompt is **Required reversal reason**. Reversing an incorrect entry restores the document to the pickup workflow and retains the history.

The doctor's **Forward to clinic reception** action is a clinical handoff. It is not the document handover recorded here. Patient accounts can track pickup status but cannot download report PDFs.

### 12.4 Distinguish completion, handoff, readiness, and collection

| Event | Who performs it | What it means |
| --- | --- | --- |
| Issue final evaluation | Authorized doctor | Clinical evaluation is complete and locked. |
| Forward to clinic reception | Authorized doctor | The finalized report is handed over to the clinic's document process; the doctor returns to the queue. |
| Review report details | Authorized administrator or receptionist | The staff member reviews the actual document before preparing its release. |
| Mark ready | Authorized administrator or receptionist | The printed document can be collected at the clinic. |
| Record release | Authorized administrator or receptionist | The printed document is physically handed to the patient or authorized representative, with recipient details recorded. |

Do not record **Released** simply because a report is clinically complete or an email has been sent. Use the recipient and verification prompts at the actual handover.

## 13. Understanding statuses

### 13.1 Appointment statuses

Not every visit passes through every status. The selected services and required verification determine the route.

| Status | Meaning and next step |
| --- | --- |
| Pending Approval | The request awaits clinic review. |
| Confirmed | The request is accepted; review the approved schedule. |
| Arrived | Attendance or arrival has been recorded. This is the patient's state, not verification of a clinician's license. |
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
| Medical certificate | Draft → Approved → Issued through the current direct-approval workflow; older pending-approval records may still appear. An approved, unissued certificate may be returned for correction; an issued certificate may be voided when permitted. |
| Tracked medical document | Processing → For review → Approved → Ready for pickup → Released; cancelled or voided records may also appear. |
| Laboratory or X-ray report | Draft → Completed/finalized; some results require verification before completion. |

## 14. Account settings and security

Open the profile menu or **Settings** to see the controls available to your role.

### 14.1 Update your profile or password

Review your profile, edit the permitted fields, and save. Follow any new email verification prompt. Where password settings are available, enter the current password, enter and confirm the new password, and submit. Receptionist settings have different access restrictions; contact administration if a needed setting is unavailable.

Receptionists can update permitted profile fields, but the current password, appearance, and two-factor settings routes exclude that role. Contact administration when a restricted setting requires attention.

### 14.2 Enable two-factor authentication

1. Open the two-factor authentication settings when available.
2. Under **Two-Factor Authentication**, select **Enable 2FA** and confirm your password if requested.
3. Begin setup and scan the QR code with your authenticator application.
4. Enter the requested code to complete setup.
5. Save the recovery codes in a secure place separate from your login device.

**Expected result:** Future logins require the additional code. Use a recovery code if you lose access to your authenticator, or contact the administrator if recovery is unavailable.

### 14.3 Professional credentials

Doctors, MedTechs, and RadTechs require an administrator-verified professional license before protected clinical actions become available.

1. Open **Profile Settings** from your account menu, or choose **Review your license details** in the verification notice.
2. Enter your **Professional License Number** and save the permitted profile changes.
3. Under **Professional License**, supply **PRC ID front** and **PRC ID back** images. JPG/JPEG/PNG is supported, with a maximum of 5 MB per image.
4. Select **Submit Proof** or **Replace Proof** and check its status.
5. Wait for an administrator to verify the documents. If rejected, read the reason, correct the details or images, and resubmit.
6. Refresh the clinical queue after verification. Submit an authorized signature through the separate signature controls when required.

Changing the saved license number clears the old proof and verification, so submit new proof and wait for review again. Uploading replacement proof returns the record to pending review. **Upload Signature** / **Replace Signature** accepts a PNG file up to 2 MB; use a clear signature image, preferably with a transparent background.

| License status | Next step |
| --- | --- |
| Not submitted | Supply the license number and required proof. |
| Pending | Wait for administrator review; uploading proof alone does not authorize examinations. |
| Verified | Protected actions can become available when assignment and visit prerequisites are also satisfied. |
| Rejected | Read the rejection reason and submit corrected proof. |

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
| Conduct PE is missing for an arrived patient | Check the doctor's verified license, assignment, scheduled date, and whether the examination or appointment is already complete. The scheduled clock time does not unlock the button. |
| Final evaluation is blocked | Resolve the incomplete services and verification items listed on the evaluation page, and check the doctor's license verification. |
| A clinical result cannot be edited | It may be finalized or locked. Ask an authorized administrator to review the correction. |
| Certificate approval is unavailable | Check the certificate status, attending physician, license number, and license verification. |
| Patient report download is unavailable | This is expected. Track document status and collect the printed report at the clinic when it is ready. |
| Forwarding a report appears to reload the page | Check whether a success message was shown and the report already says forwarded. A successful handoff returns to Doctor Queue; do not create a duplicate appointment. Report a persistent loading state to administration. |
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
| Individual patient | Register and verify → Request appointment → Clinic approval → Arrival and intake → Requested services → Final evaluation when applicable → Reception review → Ready for pickup → Printed results collected at the clinic. |
| Company bulk event | Request event → Confirm master-list import → Administrative approval and staffing → Attendance → Employee services → Resolve completed/absent employees → Generate, review, and release company report. |
| Medical certificate | Attending doctor drafts → Saves and approves → Attending doctor issues → Reception reviews and prints → Patient collects at the clinic. |
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
| Clinical handoff | The doctor's forwarding of a finalized report to clinic reception; it is separate from physical collection. |
| Release | On patient document tracking, the authorized recording of the printed document's physical handover at the clinic. Company report release is a separate, authorized company-report workflow. |
| Audit trail | The recorded history of actions and changes. |
| 2FA | Two-factor authentication, using a second login verification step. |

### 16.3 Related project guides

- [Backup and Recovery](BACKUP_RECOVERY.md): operational backup and restoration procedures.
- [User Acceptance Checklist](UAT_CHECKLIST.md): checks for confirming system behavior before rollout.
- [Company Bulk Appointment Test Guide](COMPANY_BULK_APPOINTMENT_TEST.md): detailed bulk workflow validation.
- [Manual Screenshot Checklist](USER_MANUAL_SCREENSHOTS.md): screens to capture with training accounts before publishing an illustrated edition.

**Document maintenance:** Update this manual when the system's menus, forms, permissions, or workflows change. Before distributing it for a specific deployment, have the clinic owner verify the system address, configured hours, local release procedures, and support contact information.
