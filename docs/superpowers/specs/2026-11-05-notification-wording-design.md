# Consistent, action-specific notification wording

## Intent

Revise all application notification wording so recipients can tell what happened, who performed the action, and which person or record is affected. Use correct grammar and consistent terminology. Preserve the existing license-verification redirect and wording changes already in the working tree.

The user selected:

- Identify people by name and role when the event records their identity.
- Use a shared wording helper with event-specific messages.

## Approaches

1. Edit every sentence independently. This needs less shared code but duplicates role labels, identity fallback rules, and record formatting across notification classes, observers, controllers, and services.
2. Share identity, role, reference, and terminology formatting while keeping complete sentences specific to each event. The user selected this approach because consistency must hold across the system without merging distinct clinical actions into generic updates.

## Scope

Audit and revise the 18 notification classes, the 11 notification-producing observers, direct notification messages in controllers and services, and transactional email subjects, bodies, and action labels. Include appointment requests and decisions, reminders and automatic cancellation, doctor schedules, clinical handoffs, medical certificates and documents, company referrals and bulk events, inquiries, accounts, license reviews, credentials, and password/security messages. Audit framework-generated verification/reset messages as part of the coverage inventory and customize wording only where needed to meet the same standard.

Keep notification types, recipients, authorization filters, delivery channels, destination links, delivery timing, and read/unread behavior intact. Ordinary page flash messages, validation errors, and the notification center layout are outside this wording change. Do not send test messages to real users.

This change applies to notifications generated after deployment. Previously stored database messages and already-sent emails retain their original text; no historical rewrite or migration is proposed.

## Wording rules

- Titles use sentence case and name the actual action, such as `Professional license verified` or `Laboratory results finalized`.
- Use active voice where the actor is known: `{Name} ({Role}) verified your professional license.` Staff-facing notices identify the affected person and relevant record, such as `{Name} (Administrator) verified {Staff name}'s professional license.`
- Identify the recipient as `you` or `your` when that is unambiguous. Identify other affected people or companies by name, and use the existing appointment, referral, certificate, or document reference where relevant.
- Use full role labels: Administrator, Receptionist, Doctor, Medical Technologist, Radiologic Technologist, Company Representative, and Patient. Avoid internal role keys in prose.
- Distinguish requested, submitted, draft saved, recorded, updated, performed, verified, finalized, approved, ready for pickup, issued, released, cancelled, rejected, and voided. Never describe a draft update as completion or an approval as issuance.
- For a report forwarded by a doctor to reception, say `forwarded to reception for collection preparation`; do not claim the patient collected the report or that it is already ready for pickup.
- Clearly name the system for confirmed automatic events, including reminders, automatic expiry/cancellation, and automatic queue assignment. A missing actor does not prove that the system performed an action.
- For legacy or incomplete events with no reliable actor information, use an accurate neutral sentence identifying the affected record and action. Do not invent a name, role, or attribution to the system. Exact fallback phrasing is left to implementation and review.
- Preserve existing safe reasons and next steps where appropriate. Do not copy private clinical findings, credentials, tokens, private staff-review notes, or representative details into wider notifications.
- Use the clinic's configured timezone and readable dates/times. Handle missing times or deleted related records without broken sentences or dangling punctuation.
- Match email and in-app meaning for the same event. Keep password and account-security messages factual; do not assume a password reset was initiated by the account owner.

## Implementation boundaries

Add a small shared formatting helper in the existing PHP application. Keep event-specific wording near its current event producer or notification class. A coverage checklist must account for every notification-producing location, including messages already correct that need no changes.

Prefer the event's audit actor or explicit action parameter. Use action-specific persisted fields such as `reviewed_by`, `approved_by`, `released_by`, or `assigned_by` only when they describe the event being announced. Never reuse a record's creator or an earlier reviewer as the actor of a later action. An authenticated request actor can be captured at a verified action boundary when the current event has no persisted actor.

Capture immutable actor/name/role/reference text before deferred or queued delivery where necessary. Do not consult a future request's authentication state or label the notification recipient as the performer. If a notification currently lacks the relevant appointment or actor, pass optional context from its existing call site without changing recipient selection or business behavior. Existing invocations without context must remain safe and truthful.

Avoid schema changes for this wording work. Do not introduce additional notifications or remove current notifications. Maintain existing privacy and recipient-role checks, including company isolation and changes in staff roles.

## Validation

Add focused tests for actual event-to-message behavior, actor versus affected-person attribution, automatic versus manual actions, accurate clinical/document stages, missing context, and consistent role/status labels. Update existing exact-message expectations only after verifying that the new wording matches the event. Retain notification-count, recipient, privacy, and permission assertions.

Run relevant notification, appointment, license, scheduling, inquiry, company, clinical, and document tests. Run PHP formatting and checks appropriate to changed files; run frontend checks only if frontend source changes. Final review must compare the coverage inventory against producers and verify that no generic helper assigns incorrect actors or clinical outcomes.

## Builder decisions

Helper names, method signatures, how to group tests, and the exact sentence for each audited event are implementation decisions. The examples establish style and semantics, rather than a fixed string catalog. The implementation should preserve unrelated working-tree changes and does not include a commit or push unless requested.

## Approval

Approved by the user on November 5, 2026: "do it".
