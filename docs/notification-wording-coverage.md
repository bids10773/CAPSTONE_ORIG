# Notification wording coverage

This audit applies to newly generated notifications. Existing stored notifications and sent emails are preserved. Names and roles are shown only from reliable action context; missing identity uses neutral wording. Recipients, channels, event types, permissions, links, and delivery counts remain unchanged.

## Dedicated notifications

| Source (`app/Notifications/`) | Wording and attribution |
| --- | --- |
| AppointmentAssigned | Appointment reference, patient, schedule, and explicit assigning actor. |
| AppointmentAutoCancelled | Explicit system action; distinguish missed check-in from an expired unapproved schedule. |
| AppointmentCancelled | Actual cancelling actor; identical in-app/email meaning; retain cancellation reason. |
| AppointmentConfirmed | Explicit approving actor or matching recorded reviewer; readable schedule and reference. |
| AppointmentRejected | Actual reviewer; system attribution only for automatic schedule expiry; retain safe rejection reason. |
| AppointmentReminder | System reminder for recipient's appointment; no invented human actor. |
| AppointmentSubmitted | Person who submitted the request, reference, schedule, and awaiting-review stage. |
| NewAppointmentRequest | Requesting patient/actor, affected appointment, and schedule. |
| DoctorAvailabilityChangeRequested | Requesting doctor's name and role; availability request reference. |
| DoctorScheduleChangePending | Requesting doctor and affected appointment; conditional wording until approval. |
| DoctorScheduleChanged | Reviewing actor, affected doctor, and actual rescheduling outcome. |
| OnsiteStaffAssigned | Explicit assigning actor, recipient's service role, company event, and date. |
| CompanyMedicalReferralInvitation | Snapshot of referral creator, affected company/employee, and referral reference; neutral missing-creator wording. |
| MedicalDocumentStatusChanged | Distinct approval, preparation, ready, release, cancellation, and void stages; manual transition actor supplied explicitly. |
| MedicalReportReleased | Doctor handoff to reception for collection preparation; never claims pickup readiness or completed patient collection. |
| NewInquirySubmitted | Sender, category, and inquiry record; grammatical category phrasing. |
| PasswordChanged | Factual confirmation for recipient's account; no assumption about who initiated a reset. |
| WorkflowActivity | Reviewed and retained as the generic delivery transport; wording belongs to event producers below. |

## Observer producers

| Source (`app/Observers/`) | Wording and attribution |
| --- | --- |
| AppointmentWorkflowObserver | Patient/company, appointment reference, actual changed field and stage; request actor for manual actions, explicit automatic context for derived bulk progress. |
| StaffSecurityNotificationObserver | Audit actor versus affected staff member; separate license submission, verification, rejection, profile changes, credentials, activation/deactivation, and signatures. |
| ClinicalActivityNotificationObserver | Audit actor, patient/appointment, exact clinical form and action; drafts, recording, finalization, verification, procedure, and handoff remain distinct. |
| MedicalCertificateNotificationObserver | Certificate reference, patient, action-specific actor, and draft/submission/approval/correction/issuance/void stage. |
| MedicalDocumentActivityNotificationObserver | Audit actor and document reference; review, readiness, release, and reversal described separately without private release metadata. |
| CompanyAccountNotificationObserver | Request actor and affected company; registration, update, and deletion distinguished. |
| CompanyReferralWorkflowObserver | Referral reference and affected company/employee context; creation actor is not reused for later unrelated actions. |
| BulkReportNotificationObserver | Audit actor and company/event; generation for review versus final report release/download availability. |
| DoctorAvailabilityWorkflowObserver | Reviewing actor and affected doctor/request; explicit accepted/rejected decision. |
| OnsiteStaffWorkflowObserver | Assigned staff member, company event, and actual assignment/removal/capacity update; no stale assigner for later edits. |
| OnsiteQueueWorkflowObserver | Patient, service, event and task stage; system identified only when `assignNext` explicitly marks the automatic assignment boundary. |

## Direct producers and context integration

| Source | Coverage |
| --- | --- |
| Actions/Fortify/CreateNewUser | New patient account actor and affected account. |
| Controllers/Auth/SocialAuthenticationController | Same registration wording; no provider identifiers or private contact/profile data. |
| Controllers/Auth/PatientProfileCompletionController | Patient name/role and completed-profile action. |
| Controllers/Settings/ProfileController | Self-edit actor and exact profile update/completion. |
| Controllers/AdminPatientController | Actual administrator and affected patient account, including deletion snapshot. |
| Controllers/DoctorAvailabilityController | Administrator, affected doctor, update versus clearing availability. |
| Controllers/AppointmentController | Administrator-created appointments, patient/receptionist/admin audiences, explicit cancellation actor. |
| Controllers/StaffController | Pass explicit actor to new/resend credential emails; retain license-verification redirect. |
| Controllers/Admin/InquiryController | Pass current status-update actor rather than reuse an earlier responder. |
| Services/InquiryService | Reply/status action, actor and inquiry reference, owner-specific next step; private reply text omitted from broader alerts. |
| Services/DoctorAvailabilityChangeService | Rejection actor, affected doctor/request and unchanged patient appointment. |
| Services/BulkAppointmentEnrollmentService | Explicit automatic system-derived parent status based on employee progress. |
| Services/AppointmentApprovalService | Construct actor-aware patient confirmation/rejection and doctor assignment before deferred delivery. |
| Services/IndividualAppointmentBookingService | Pass actual submitting patient to request and submission notifications. |
| Services/OnsiteEventWorkflowService | Snapshot explicit assigning actor before deferred notice; mark automatic queue assignment separately. |
| Services/MedicalDocumentService | Pass actual manual actor for readiness/release/reversal; source action and actor preserved for certificate submission, correction, draft, approval, issuance, and void; neutral context when identity is unavailable. |
| Controllers/PhysicalExamController | Snapshot handoff notification and forwarding doctor before after-commit delivery. |
| Services/AppointmentSchedulingService | Reviewed; automatic expiry/cancellation already passes dedicated notifications with confirmed automatic reasons. |
| Services/AppointmentReminderService | Reviewed; sends dedicated system reminder for the existing appointment. |
| Services/CompanyReferralService | Reviewed; dedicated invitation snapshots its creation actor; invitation token excluded from general alerts. |
| Services/CompanyAccountService | Pass explicit actor to credential generation/resend emails. |
| Services/StaffCredentialService | Forward explicit actor for both initial and regenerated credentials. |
| Controllers/Settings/PasswordController, Controllers/TemporaryPasswordController, Actions/Fortify/ResetUserPassword | Reviewed; dedicated password confirmation stays factual and does not attribute an unknown reset requester. |

## Transactional emails

| Source | Coverage |
| --- | --- |
| Mail/CompanyInvitation + email/company-invitation | Company and explicit actor; generated credentials wording also correct on resend, without claiming a new account. |
| Mail/StaffTemporaryCredentials + email/staff-temporary-credentials | Snapshot actor and readable staff role; generated credentials wording correct for initial/resend flows. |
| Mail/InquiryReply + email/inquiry-reply | Responder name/role and affected inquiry; private response appears only in the intended recipient's email. |
| Mail/InquiryAcknowledgment + email/inquiry-acknowledgment | System receipt and inquiry reference; does not claim account creation/approval. |
| Notifications/CompanyMedicalReferralInvitation + email/company-referral-invitation | Referral creator name/role and affected company/employee; safe fallback when creator is missing. |
| Notifications/PasswordChanged + email/password-changed | Sentence-case security confirmation; unchanged warning for unexpected changes. |
| Providers/AppServiceProvider + email/custom-reset | Framework reset-email customization reviewed; system received a reset request, not proof that recipient requested it. |
| Providers/AppServiceProvider + email/custom-verify | Verification link for the recipient's account; no claim that verification already succeeded. |
| Other dedicated notification mail methods | Same action, actor, record, schedule, and stage as their in-app equivalents. |

## Verification record

Full PHP suite: 891 tests passed, 7496 assertions. Final focused wording regressions: 58 tests passed / 254 assertions and 35 tests passed / 180 assertions. Independent review found no remaining Important defects after the attribution and document-action fixes. PHP formatting and whitespace checks are part of final verification; no frontend source changed.
