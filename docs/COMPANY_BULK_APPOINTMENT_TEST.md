# Company Bulk Appointment Test Guide

Use a staging or local environment with synthetic data only. Do not upload real employee or medical information.

## Test accounts required

- One active company account
- One administrator
- One receptionist
- One doctor
- One medical technologist when laboratory services are selected
- One radiologic technologist when X-ray is selected

## Sample appointment data

| Field | Test value |
| --- | --- |
| Location | Onsite |
| Address | Test Company Main Office |
| Contact person | Maria Santos |
| Contact number | 09171234567 |
| Expected employees | 3 |
| Services | PE, CBC, X-Ray |
| Requested date | A future weekday |

Prepare a copy of the downloadable employee master-list template containing three synthetic employees. Include unique employee numbers, names, birthdates, sex, civil status, and contact details. Add one duplicate row only for the validation test; remove it before final import.

## End-to-end happy path

1. Sign in as the company account and create a bulk appointment using the sample values.
   - Expected: the request is saved as `company_bulk`, its purpose is Annual Physical Examination, its status is pending/draft, and no doctor or final duration is assigned yet.
2. Download the current master-list template, populate it with the three synthetic employees, and upload it.
   - Expected: the preview shows exactly three valid rows and does not expose or create employee passwords.
3. Confirm the import.
   - Expected: three employees are enrolled under the same parent bulk event; refreshing the page does not duplicate them.
4. Sign in as administrator and open the Bulk Appointments approval queue.
   - Expected: the parent event appears once, employee child appointments do not appear as separate bulk requests, and the employee count is three.
5. Approve the request, select one or two clinic days, and assign all required staff.
   - Expected: approval is blocked until a receptionist and every required clinical role are assigned. Successful approval propagates the accepted status and event dates to all three employees.
6. Sign in as the assigned receptionist and open the onsite attendance page.
   - Expected: only employees from this event are shown. Mark two arrived and one absent.
7. Process each arrived employee using only the assigned Doctor, MedTech, and RadTech workspaces.
   - Expected: each department has an independent queue; unassigned staff are denied; one employee's progress does not complete another employee.
8. Finalize the required clinical results and final evaluation.
   - Expected: the parent event reaches completion only after every arrived employee is resolved. The absent employee remains recorded as absent and does not block completion.
9. Release the bulk medical report and return to the company account.
   - Expected: the owning company can access the released report and employee completion statuses but cannot open detailed employee clinical records or another company's data.

## Required negative tests

- Submit a bulk request without a master list: approval must be rejected.
- Upload a wrong file type, malformed workbook, duplicate employee number, invalid birthdate, or employee belonging to another company: preview/import must reject or clearly flag the affected rows.
- Submit the same import confirmation twice: employees must not be duplicated.
- Omit a required staff role during approval: approval must be rejected without partially saving assignments.
- Use a weekend or past date: booking must be rejected.
- Attempt attendance with an unassigned receptionist: access must be denied.
- Attempt clinical work with an unassigned or wrong-role staff account: access must be denied.
- Attempt to view the event or report from another company: access must be denied.
- Try to download an unreleased report: access must be denied.

## Automated regression commands

Run the core company bulk workflow:

```powershell
php artisan test tests/Feature/CompanyBulkBookingTest.php
```

Run import, onsite processing, and bulk-report coverage:

```powershell
php artisan test tests/Feature/CompanyEmployeeImportTest.php tests/Feature/OnsiteEventWorkflowTest.php tests/Feature/CompanyBulkMedicalReportWorkflowTest.php
```

The release gate is zero failed tests. Record the tester, date, environment, test data identifier, actual results, screenshots for each role, and any issue references in the UAT sign-off.
