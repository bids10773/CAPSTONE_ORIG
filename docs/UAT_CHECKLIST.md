# User Acceptance Test Checklist

Use staging accounts and synthetic records only. Record tester, date, browser/device, result, and evidence for every item.

## Patient

- Registration, email verification, login, logout, reset, and 2FA
- Profile completion and update
- Appointment creation, validation, limits, history, and notifications
- Access only to owned and released medical results

## Company

- Invitation and temporary-password flow
- Employee spreadsheet preview, validation, duplicate handling, and confirmation
- Referral and bulk-event booking
- Released bulk-report download restricted to the owning company
- Complete the detailed [company bulk appointment test](COMPANY_BULK_APPOINTMENT_TEST.md), including approval, staffing, attendance, clinical queues, completion, and negative access cases

## Receptionist

- Walk-in registration, patient search, appointment approval/rejection, and doctor assignment
- Queue ordering and onsite attendance
- Rejection of unauthorized clinical changes

## Clinical staff

- Doctor, MedTech, and RadTech dashboards and assigned queues
- Pending, verification, finalization, locking, and release workflows
- Access denied for unassigned staff and unreleased patient results

## Administrator

- Staff, patient, company, appointment, inquiry, and availability management
- Reports, analytics, forecasting, onsite staffing, and bulk-report release
- Audit/security information and protected downloads

## Cross-cutting

- Phone, tablet, laptop, and wide desktop layouts
- Latest Chrome, Edge, Firefox, and Safari where supported
- Keyboard-only navigation, visible focus, labels, announcements, and contrast
- Empty, loading, error, offline, timeout, and retry states
- Expired links, stale forms, duplicate submissions, malformed files, and rate limits
- SMTP, OAuth, weather, and ML service failure behavior

Deployment requires system-owner sign-off and resolution or explicit acceptance of every failed item.
