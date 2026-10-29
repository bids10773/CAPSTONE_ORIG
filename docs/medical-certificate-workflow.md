# Medical certificate workflow

PE means Physical Examination only. An appointment is a complete examination package only when it includes PE and its purpose is pre-employment or annual examination. Standalone PE has its own Physical Examination Report, with separate reports for other explicitly selected services. Consultation / Certificate Request visits show the Medical Certificate and any doctor-requested service reports; they do not register a complete examination report. Incorrect legacy complete-report entries on consultation requests are hidden from release listings without deleting their history.

Patients select **Medical Consultation / Certificate Request**, described as: “For patients who need a medical checkup, sick leave assessment, or medical certificate.” They select a doctor before choosing an available date and time. Individual bookings include the consultation and examination (PE); additional services are requested by the doctor only when needed.

The attending doctor records the medical history and examination, then requests any additional services from the system's available service catalog. Existing requests are retained. Requested laboratory services and X-Ray follow the existing clinic queues. The certificate editor shows service completion and links for reviewing the clinical records. Approval and issuance require the examination and all requested services to be complete; the doctor decides whether a certificate is justified. Pre-employment and annual examinations retain their separate final evaluation workflow.

1. The attending physician prepares the certificate and chooses **Save draft** for unfinished work or **Save and approve** for a completed certificate.
2. Save and approve validates the required certificate information and the physician's admin-verified license, then saves and approves in one transaction. A validation failure does not save partial changes. Existing drafts and returned certificates can also be approved directly; previously submitted certificates remain reviewable.
3. Only the attending physician with a verified license can **Issue certificate**. Approval alone does not issue the document or complete the appointment. Issuance locks the certificate and completes its linked Medical Certificate appointment.
4. Receptionists can print issued certificates, review their document records, mark them ready for pickup, and record release. Readiness and release require an issued certificate. Administrators verify licenses and retain existing oversight/void permissions.

Actions retain their audit records and operational notifications. The older submission endpoint remains available for compatibility; the current interface uses direct approval.

An approved, unissued certificate can be returned for correction by its attending doctor, with a reason. This clears approval and permits completing an older consultation before reapproval. Already attended consultation requests may continue after the original booking day.

Requesting a new laboratory section after a finalized report reopens that report while retaining its recorded results. Additional laboratory requests must wait while Drug Test verification is pending; other services may still be requested. The form explains this constraint when it applies.
