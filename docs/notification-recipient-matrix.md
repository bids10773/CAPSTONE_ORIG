# Notification recipient matrix

Operational messages contain workflow status, not diagnoses, results, license documents, private responses, passwords, or demographic values. Record access remains governed by existing policies.

| Activity | Administrator visibility | Other recipients |
| --- | --- | --- |
| Patient registration, profile completion, meaningful profile edits | New registration/completion/update notice | Existing self-service confirmation remains |
| Individual appointment request | Existing pending-review notice | Receptionists and submitting patient |
| Appointment approval/rejection, arrival, cancellation, assignment or schedule changes | Workflow update | Patient and assigned/previous doctor where relevant; existing confirmations preserved |
| Company account creation/update/removal | Company account notice | Active representatives of that company on updates |
| Company referral creation/status changes | Referral notice | Linked patient and representatives of the same company |
| Company referral appointment request | Appointment notice | Receptionist coordination and patient submission notice |
| Bulk event submission/status/completion/cancellation | Event workflow update | Own company; deployed staff on cancellation |
| Final company report generated/released | Explicit review/release notice | Own company receives download availability only after release |
| Onsite deployment, attendance and queue assignment/progress | Operational update | Exact assigned staff; removed staff get a safe list destination |
| Doctor availability requested | Existing review request | Existing affected-patient pending notice |
| Availability approved/rejected or directly changed | Decision/change notice | Requesting doctor, affected patients, receptionist coordination as relevant |
| Staff license submitted/changed | Verification action needed | Existing upload confirmation remains |
| License verified/rejected | Decision notice | Affected current staff account |
| Staff account/signature/access changes | Staff operational notice | Affected staff for relevant account decisions; existing credential emails preserved |
| Clinical work, verification, vitals and rechecks | Generic clinical workflow notice | Assigned clinical staff, physician, or receptionist recheck team |
| Final examination/report preparation | Finalization/release activity | Receptionists; existing patient release notice preserved |
| Certificate creation, edits and lifecycle decisions | Certificate update | Authorized attending physician/creator; receptionist team for approval/issuance/void |
| Document review, readiness, release or reversal | Document operational update | Existing patient document notifications preserved |
| Inquiry received | Existing new-inquiry notice | Existing acknowledgment email |
| Inquiry explicit status change or reply | Inquiry activity | Signed-in inquiry owner; existing reply email preserved |

## Delivery and authorization

- New operational alerts use database storage and the existing private user notification channel.
- Delivery waits for commit; failed transactions do not notify. Individual delivery or broadcast failures do not roll back business operations.
- The sender excludes inactive users and duplicate recipients, and rechecks role/company affiliation at delivery.
- New notifications record their intended recipient role; company notices also record company affiliation. Visibility and notification actions remain scoped to the account and current authorization.
- The bell and notification page refresh from live events, focus/reconnect, and a 15-second visible-tab fallback. Live transport depends on the configured Reverb service; polling continues when it is unavailable.
- Read-only record views, downloads, unchanged saves, and ordinary document synchronization do not create operational alerts.
