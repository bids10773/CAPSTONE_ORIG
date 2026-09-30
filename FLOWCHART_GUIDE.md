# Flowchart Written Guide

## Web-Based Medical Services Management System with Client Trend Analysis for Living Myth Industrial Clinic

This guide specifies what to place inside each flowchart symbol. Arrange every flowchart from top to bottom and connect consecutive steps using **Flow Line / Arrow** symbols. The directions written after each decision identify the branch to follow and where branches reconnect.

## 1. Simple Overall / Main System Flowchart

Keep this as the shortest presentation-level flowchart.

### Step 1
Symbol: Terminator / Oval  
Text inside symbol: Start

### Step 2
Symbol: Input / Output / Parallelogram  
Text inside symbol: Provide Patient or Company Employee Information

### Step 3
Symbol: Input / Output / Parallelogram  
Text inside symbol: Select Requested Medical Service

### Step 4
Symbol: Input / Output / Parallelogram  
Text inside symbol: Book Appointment or Register as Walk-in

### Step 5
Symbol: Process / Rectangle  
Text inside symbol: Receptionist Verifies Patient and Service Information

### Step 6
Symbol: Input / Output / Parallelogram  
Text inside symbol: Patient Arrives and Checks In

### Step 7
Symbol: Process / Rectangle  
Text inside symbol: Conduct Physical Examination

### Step 8
Symbol: Decision / Diamond  
Text inside symbol: Are Diagnostic Services Required?

YES → Proceed to Step 9.  
NO → Proceed to Step 12.

### Step 9
Symbol: Process / Rectangle  
Text inside symbol: Perform Required Laboratory and/or X-ray Examination

### Step 10
Symbol: Decision / Diamond  
Text inside symbol: Are All Required Diagnostic Results Complete?

YES → Proceed to Step 11.  
NO → Return to Step 9 for the remaining required service or result.

### Step 11
Symbol: Process / Rectangle  
Text inside symbol: Make Completed Diagnostic Results Available to the Doctor

The YES branch from Step 10 reconnects with the NO branch from Step 8 at Step 12.

### Step 12
Symbol: Process / Rectangle  
Text inside symbol: Doctor Performs Final Medical Evaluation

### Step 13
Symbol: Process / Rectangle  
Text inside symbol: Generate and Release Medical Clearance or Result

### Step 14
Symbol: Input / Output / Parallelogram  
Text inside symbol: Patient or Company Receives Permitted Result

### Step 15
Symbol: Process / Rectangle  
Text inside symbol: Update Records, Reports, and Analytics

### Step 16
Symbol: Terminator / Oval  
Text inside symbol: End

## 2. Patient Flowchart

### Step 1
Symbol: Terminator / Oval  
Text inside symbol: Start

### Step 2
Symbol: Input / Output / Parallelogram  
Text inside symbol: Register or Log In

### Step 3
Symbol: Decision / Diamond  
Text inside symbol: Is the Account or Login Valid?

YES → Proceed to Step 4.  
NO → Return to Step 2 to correct the registration or login information.

### Step 4
Symbol: Input / Output / Parallelogram  
Text inside symbol: Complete or Update Patient Profile

### Step 5
Symbol: Input / Output / Parallelogram  
Text inside symbol: Select Medical Service and Examination Purpose

### Step 6
Symbol: Input / Output / Parallelogram  
Text inside symbol: Choose Appointment Date, Doctor, and Time

### Step 7
Symbol: Decision / Diamond  
Text inside symbol: Is the Selected Schedule Available?

YES → Proceed to Step 8.  
NO → Return to Step 6 and select another available schedule.

### Step 8
Symbol: Input / Output / Parallelogram  
Text inside symbol: Submit Appointment Request

### Step 9
Symbol: Process / Rectangle  
Text inside symbol: Wait for Clinic Review

### Step 10
Symbol: Decision / Diamond  
Text inside symbol: Was the Appointment Accepted?

YES → Proceed to Step 13.  
NO → Proceed to Step 11.

### Step 11
Symbol: Input / Output / Parallelogram  
Text inside symbol: Receive Rejection or Cancellation Notification

### Step 12
Symbol: Decision / Diamond  
Text inside symbol: Select Another Schedule?

YES → Return to Step 6.  
NO → Proceed to Step 25.

### Step 13
Symbol: Input / Output / Parallelogram  
Text inside symbol: Receive Confirmed Appointment Details and Reminder

### Step 14
Symbol: Process / Rectangle  
Text inside symbol: Go to the Clinic on the Confirmed Schedule

### Step 15
Symbol: Process / Rectangle  
Text inside symbol: Receptionist Confirms Arrival

### Step 16
Symbol: Process / Rectangle  
Text inside symbol: Undergo Physical Examination

### Step 17
Symbol: Decision / Diamond  
Text inside symbol: Are Additional Diagnostic Services Required?

YES → Proceed to Step 18.  
NO → Proceed to Step 21.

### Step 18
Symbol: Process / Rectangle  
Text inside symbol: Undergo Required Laboratory and/or X-ray Examination

### Step 19
Symbol: Process / Rectangle  
Text inside symbol: Wait for Diagnostic Service Completion

### Step 20
Symbol: Decision / Diamond  
Text inside symbol: Are All Required Diagnostic Services Complete?

YES → Proceed to Step 21.  
NO → Return to Step 18 for the remaining required service.

The YES branch from Step 20 reconnects with the NO branch from Step 17 at Step 21.

### Step 21
Symbol: Process / Rectangle  
Text inside symbol: Doctor Performs Final Medical Evaluation

### Step 22
Symbol: Process / Rectangle  
Text inside symbol: Complete Medical Service Transaction

### Step 23
Symbol: Decision / Diamond  
Text inside symbol: Has the Medical Result Been Finalized and Released?

YES → Proceed to Step 24.  
NO → Remain at Step 23 and wait for release.

### Step 24
Symbol: Input / Output / Parallelogram  
Text inside symbol: View Available Medical Result or Medical Clearance

### Step 25
Symbol: Terminator / Oval  
Text inside symbol: End

## 3. Receptionist Flowchart

This flow includes front-desk and administrative patient information only. It does not give the receptionist access to confidential clinical findings or medical PDFs.

### Step 1
Symbol: Terminator / Oval  
Text inside symbol: Start

### Step 2
Symbol: Input / Output / Parallelogram  
Text inside symbol: Enter Receptionist Login Credentials

### Step 3
Symbol: Decision / Diamond  
Text inside symbol: Are the Login Credentials Valid?

YES → Proceed to Step 4.  
NO → Return to Step 2.

### Step 4
Symbol: Input / Output / Parallelogram  
Text inside symbol: View Appointment Requests, Patient Records, and Walk-in Queue

### Step 5
Symbol: Input / Output / Parallelogram  
Text inside symbol: Select Patient

### Step 6
Symbol: Process / Rectangle  
Text inside symbol: Verify Patient, Contact, Schedule, and Requested Service Information

### Step 7
Symbol: Decision / Diamond  
Text inside symbol: Does the Patient Have an Appointment?

YES → Proceed to Step 8.  
NO → Proceed to Step 13 for walk-in registration.

### Step 8
Symbol: Input / Output / Parallelogram  
Text inside symbol: Review Appointment Request and Schedule

### Step 9
Symbol: Decision / Diamond  
Text inside symbol: Is the Appointment Still Pending?

YES → Proceed to Step 10.  
NO → Proceed to Step 12.

### Step 10
Symbol: Decision / Diamond  
Text inside symbol: Approve the Appointment Request?

YES → Proceed to Step 12.  
NO → Proceed to Step 11.

### Step 11
Symbol: Process / Rectangle  
Text inside symbol: Record Rejection Reason and Notify Patient

After notification, return to Step 4 to process another patient.

### Step 12
Symbol: Process / Rectangle  
Text inside symbol: Confirm Patient Arrival

Proceed to Step 17. This is where the appointment branch reconnects with the walk-in branch.

### Step 13
Symbol: Input / Output / Parallelogram  
Text inside symbol: Search for Existing Patient

### Step 14
Symbol: Decision / Diamond  
Text inside symbol: Is an Existing Patient Record Found?

YES → Proceed to Step 16 using the selected patient record.  
NO → Proceed to Step 15.

### Step 15
Symbol: Input / Output / Parallelogram  
Text inside symbol: Register New Patient Information

### Step 16
Symbol: Process / Rectangle  
Text inside symbol: Create Walk-in Transaction and Queue Entry

Proceed to Step 17.

### Step 17
Symbol: Decision / Diamond  
Text inside symbol: Are Patient Information and Service Details Complete?

YES → Proceed to Step 19.  
NO → Proceed to Step 18.

### Step 18
Symbol: Input / Output / Parallelogram  
Text inside symbol: Inform Patient and Correct Missing Administrative Information

Return to Step 17 after correction.

### Step 19
Symbol: Process / Rectangle  
Text inside symbol: Continue Patient Processing

### Step 20
Symbol: Process / Rectangle  
Text inside symbol: Forward Patient to the Assigned Medical Service Queue

### Step 21
Symbol: Process / Rectangle  
Text inside symbol: Update Arrival and Queue Status

### Step 22
Symbol: Input / Output / Parallelogram  
Text inside symbol: Monitor Administrative Patient Progress

### Step 23
Symbol: Decision / Diamond  
Text inside symbol: Process Another Patient?

YES → Return to Step 4.  
NO → Proceed to Step 24.

### Step 24
Symbol: Terminator / Oval  
Text inside symbol: End

## 4. Doctor Flowchart

### Step 1
Symbol: Terminator / Oval  
Text inside symbol: Start

### Step 2
Symbol: Input / Output / Parallelogram  
Text inside symbol: Enter Doctor Login Credentials

### Step 3
Symbol: Decision / Diamond  
Text inside symbol: Are the Login Credentials Valid?

YES → Proceed to Step 4.  
NO → Return to Step 2.

### Step 4
Symbol: Input / Output / Parallelogram  
Text inside symbol: View Waiting or Assigned Patients

### Step 5
Symbol: Input / Output / Parallelogram  
Text inside symbol: Select Patient

### Step 6
Symbol: Input / Output / Parallelogram  
Text inside symbol: Review Patient Information and Requested Medical Services

### Step 7
Symbol: Process / Rectangle  
Text inside symbol: Conduct Physical Examination

### Step 8
Symbol: Input / Output / Parallelogram  
Text inside symbol: Record Physical Examination and Medical History Findings

### Step 9
Symbol: Decision / Diamond  
Text inside symbol: Are Diagnostic Services Required?

YES → Proceed to Step 10.  
NO → Proceed to Step 13.

### Step 10
Symbol: Process / Rectangle  
Text inside symbol: Forward Patient to Required Laboratory and/or X-ray Services

### Step 11
Symbol: Process / Rectangle  
Text inside symbol: Wait for Diagnostic Results

### Step 12
Symbol: Decision / Diamond  
Text inside symbol: Are All Required Examinations and Results Complete?

YES → Proceed to Step 14.  
NO → Return to Step 11 and keep the patient pending.

### Step 13
Symbol: Decision / Diamond  
Text inside symbol: Are All Required Non-diagnostic Examination Details Complete?

YES → Proceed to Step 15.  
NO → Return to Step 8 to complete the examination record.

### Step 14
Symbol: Input / Output / Parallelogram  
Text inside symbol: Review Completed Laboratory and X-ray Results

The diagnostic and non-diagnostic branches reconnect at Step 15.

### Step 15
Symbol: Process / Rectangle  
Text inside symbol: Conduct Final Medical Evaluation

### Step 16
Symbol: Process / Rectangle  
Text inside symbol: Determine Medical Assessment and Clearance Classification

### Step 17
Symbol: Decision / Diamond  
Text inside symbol: Is the Final Evaluation Complete and Valid?

YES → Proceed to Step 18.  
NO → Return to Step 15 to complete or correct the evaluation.

### Step 18
Symbol: Process / Rectangle  
Text inside symbol: Finalize the Medical Transaction

### Step 19
Symbol: Process / Rectangle  
Text inside symbol: Approve and Release Medical Clearance or Result

### Step 20
Symbol: Terminator / Oval  
Text inside symbol: End

## 5. Medical Technologist Flowchart

### Step 1
Symbol: Terminator / Oval  
Text inside symbol: Start

### Step 2
Symbol: Input / Output / Parallelogram  
Text inside symbol: Enter Medical Technologist Login Credentials

### Step 3
Symbol: Decision / Diamond  
Text inside symbol: Are the Login Credentials Valid?

YES → Proceed to Step 4.  
NO → Return to Step 2.

### Step 4
Symbol: Input / Output / Parallelogram  
Text inside symbol: View Patients Assigned for Laboratory Services

### Step 5
Symbol: Input / Output / Parallelogram  
Text inside symbol: Select Patient

### Step 6
Symbol: Input / Output / Parallelogram  
Text inside symbol: Review Requested Laboratory Services and Patient Information

### Step 7
Symbol: Decision / Diamond  
Text inside symbol: Is the Patient Ready for the Requested Laboratory Service?

YES → Proceed to Step 9.  
NO → Proceed to Step 8.

### Step 8
Symbol: Process / Rectangle  
Text inside symbol: Return Patient for Completion of Missing Requirements

After requirements are completed, return to Step 7.

### Step 9
Symbol: Input / Output / Parallelogram  
Text inside symbol: Collect or Receive Laboratory Sample

### Step 10
Symbol: Process / Rectangle  
Text inside symbol: Update Laboratory Service Progress

### Step 11
Symbol: Process / Rectangle  
Text inside symbol: Perform Requested Laboratory Procedure

### Step 12
Symbol: Input / Output / Parallelogram  
Text inside symbol: Enter Laboratory Results

### Step 13
Symbol: Process / Rectangle  
Text inside symbol: Review Encoded Laboratory Results

### Step 14
Symbol: Decision / Diamond  
Text inside symbol: Are the Laboratory Results Complete and Valid?

YES → Proceed to Step 16.  
NO → Proceed to Step 15.

### Step 15
Symbol: Input / Output / Parallelogram  
Text inside symbol: Correct or Complete Laboratory Result Information

Return to Step 13 for another review.

### Step 16
Symbol: Process / Rectangle  
Text inside symbol: Finalize Laboratory Service

### Step 17
Symbol: Process / Rectangle  
Text inside symbol: Make Laboratory Results Available for Doctor Final Evaluation

### Step 18
Symbol: Terminator / Oval  
Text inside symbol: End

## 6. Radiologic Technologist Flowchart

### Step 1
Symbol: Terminator / Oval  
Text inside symbol: Start

### Step 2
Symbol: Input / Output / Parallelogram  
Text inside symbol: Enter Radiologic Technologist Login Credentials

### Step 3
Symbol: Decision / Diamond  
Text inside symbol: Are the Login Credentials Valid?

YES → Proceed to Step 4.  
NO → Return to Step 2.

### Step 4
Symbol: Input / Output / Parallelogram  
Text inside symbol: View Patients Assigned for X-ray Services

### Step 5
Symbol: Input / Output / Parallelogram  
Text inside symbol: Select Patient

### Step 6
Symbol: Input / Output / Parallelogram  
Text inside symbol: Review Requested X-ray Service and Patient Information

### Step 7
Symbol: Decision / Diamond  
Text inside symbol: Is the Patient Ready for the Requested X-ray Service?

YES → Proceed to Step 9.  
NO → Proceed to Step 8.

### Step 8
Symbol: Process / Rectangle  
Text inside symbol: Return Patient for Completion of Missing Requirements

After requirements are completed, return to Step 7.

### Step 9
Symbol: Process / Rectangle  
Text inside symbol: Perform X-ray Procedure

### Step 10
Symbol: Input / Output / Parallelogram  
Text inside symbol: Enter X-ray Findings, Impression, and Recommendation

### Step 11
Symbol: Process / Rectangle  
Text inside symbol: Review X-ray Result

### Step 12
Symbol: Decision / Diamond  
Text inside symbol: Is the X-ray Result Complete and Valid?

YES → Proceed to Step 14.  
NO → Proceed to Step 13.

### Step 13
Symbol: Input / Output / Parallelogram  
Text inside symbol: Correct or Complete X-ray Result Information

Return to Step 11 for another review.

### Step 14
Symbol: Process / Rectangle  
Text inside symbol: Finalize X-ray Service

### Step 15
Symbol: Process / Rectangle  
Text inside symbol: Make X-ray Result Available for Doctor Final Evaluation

### Step 16
Symbol: Terminator / Oval  
Text inside symbol: End

## 7. Administrator Flowchart

The administrator manages accounts, operations, reports, security, analytics, and forecasting. The administrator does not conduct medical examinations.

### Step 1
Symbol: Terminator / Oval  
Text inside symbol: Start

### Step 2
Symbol: Input / Output / Parallelogram  
Text inside symbol: Enter Administrator Login Credentials

### Step 3
Symbol: Decision / Diamond  
Text inside symbol: Are the Login Credentials Valid?

YES → Proceed to Step 4.  
NO → Return to Step 2.

### Step 4
Symbol: Input / Output / Parallelogram  
Text inside symbol: View Administrator Dashboard

### Step 5
Symbol: Input / Output / Parallelogram  
Text inside symbol: Select Administrative Function

Available functions include staff, company, and patient account management; account status and permissions; appointment and bulk-event monitoring; reports and security review; client/service trends; patient-volume trends; and disease forecast simulation.

### Step 6
Symbol: Decision / Diamond  
Text inside symbol: Is the Selected Function a Management Task?

YES → Proceed to Step 7.  
NO → Proceed to Step 13 for monitoring, reporting, or analytics.

### Step 7
Symbol: Input / Output / Parallelogram  
Text inside symbol: View Selected Account or Operational Information

### Step 8
Symbol: Input / Output / Parallelogram  
Text inside symbol: Enter or Update Authorized Information

### Step 9
Symbol: Process / Rectangle  
Text inside symbol: Validate Entered Changes

### Step 10
Symbol: Decision / Diamond  
Text inside symbol: Are the Entered Changes Valid?

YES → Proceed to Step 12.  
NO → Proceed to Step 11.

### Step 11
Symbol: Input / Output / Parallelogram  
Text inside symbol: Correct Invalid or Incomplete Information

Return to Step 9 for validation.

### Step 12
Symbol: Process / Rectangle  
Text inside symbol: Save Changes and Update System Records

Proceed to Step 15.

### Step 13
Symbol: Input / Output / Parallelogram  
Text inside symbol: Select Transactions, Reports, Trends, or Forecast View

### Step 14
Symbol: Input / Output / Parallelogram  
Text inside symbol: View Operational Reports, Client Trends, Patient Volume, or Disease Simulation Results

The management and viewing branches reconnect at Step 15.

### Step 15
Symbol: Process / Rectangle  
Text inside symbol: Return to Administrator Dashboard

### Step 16
Symbol: Decision / Diamond  
Text inside symbol: Perform Another Administrative Task?

YES → Return to Step 5.  
NO → Proceed to Step 17.

### Step 17
Symbol: Process / Rectangle  
Text inside symbol: Log Out

### Step 18
Symbol: Terminator / Oval  
Text inside symbol: End

## 8. Company / Company Representative Flowchart

The company representative may view administrative progress and only medical documents that have been finalized and released for the company's own employees.

### Step 1
Symbol: Terminator / Oval  
Text inside symbol: Start

### Step 2
Symbol: Input / Output / Parallelogram  
Text inside symbol: Enter Company Representative Login Credentials

### Step 3
Symbol: Decision / Diamond  
Text inside symbol: Are the Login Credentials Valid?

YES → Proceed to Step 4.  
NO → Return to Step 2.

### Step 4
Symbol: Input / Output / Parallelogram  
Text inside symbol: View Company Dashboard and Employee Information

### Step 5
Symbol: Input / Output / Parallelogram  
Text inside symbol: Select Company Medical Service Transaction

### Step 6
Symbol: Decision / Diamond  
Text inside symbol: Is This an Individual Employee Referral?

YES → Proceed to Step 7.  
NO → Proceed to Step 9 for a bulk appointment.

### Step 7
Symbol: Input / Output / Parallelogram  
Text inside symbol: Enter Employee Referral Details and Required Services

### Step 8
Symbol: Process / Rectangle  
Text inside symbol: Submit Individual Employee Referral

Proceed to Step 11.

### Step 9
Symbol: Input / Output / Parallelogram  
Text inside symbol: Book Company Bulk Appointment

### Step 10
Symbol: Input / Output / Parallelogram  
Text inside symbol: Upload or Enter Employee Information for the Bulk Event

The individual and bulk transaction branches reconnect at Step 11.

### Step 11
Symbol: Process / Rectangle  
Text inside symbol: Clinic Verifies Company, Employee, and Service Information

### Step 12
Symbol: Decision / Diamond  
Text inside symbol: Is the Submitted Information Valid and Accepted?

YES → Proceed to Step 14.  
NO → Proceed to Step 13.

### Step 13
Symbol: Input / Output / Parallelogram  
Text inside symbol: Receive Validation Error or Correction Request

Return to Step 7 for an individual referral or Step 10 for a bulk employee submission.

### Step 14
Symbol: Process / Rectangle  
Text inside symbol: Employees Proceed Through the Clinic Medical Process

### Step 15
Symbol: Input / Output / Parallelogram  
Text inside symbol: Monitor Employee Appointment and Service Progress

### Step 16
Symbol: Decision / Diamond  
Text inside symbol: Are the Employee Medical Services Completed?

YES → Proceed to Step 17.  
NO → Return to Step 15 and continue monitoring pending services.

### Step 17
Symbol: Input / Output / Parallelogram  
Text inside symbol: View or Download Permitted Finalized and Released Results

This step must not expose draft results or clinical information belonging to employees outside the representative's company.

### Step 18
Symbol: Input / Output / Parallelogram  
Text inside symbol: Review Company Transaction and Employee Record Information

### Step 19
Symbol: Terminator / Oval  
Text inside symbol: End

## Consistency Notes for Drawing

1. Use a **Flow Line / Arrow** between every connected step and place the words **YES** and **NO** beside the appropriate outgoing decision arrows.
2. Draw the primary or YES path downward when practical. Draw NO paths to the side and loop them back to the referenced correction, waiting, or selection step.
3. Use these consistent service terms: **Physical Examination**, **Laboratory Examination**, **X-ray Examination**, and **Final Medical Evaluation**.
4. Use these statuses only where useful in detailed charts: **Pending**, **Accepted**, **Arrived**, **For Diagnostics**, **For X-ray**, **For Final Evaluation**, **Completed**, and **Cancelled/Rejected**.
5. Do not place every internal status in the simple main flowchart.
6. Receptionists may view administrative patient and appointment history but not clinical findings or clinical PDF documents.
7. Medical Technologists may work with laboratory records only. Radiologic Technologists may work with X-ray records only. Doctors may access the clinical information required for physical examination and final evaluation.
8. Company representatives may access only their own employees' permitted, finalized, and released results.
9. The administrator manages and monitors the system but does not perform physical examinations, laboratory procedures, X-ray procedures, or final medical evaluations.
