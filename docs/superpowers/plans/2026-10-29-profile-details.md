# Profile Details and Floating Edit Button

Keep Edit Profile visible as a fixed bottom-right button while viewing Personal Information. Mount it through a hydration-safe document-body portal so profile card clipping and animated page stacking cannot cover it. Hide it while editing or viewing security sections; move focus to the edit form on activation. Preserve space below content so the button does not cover the last fields.

Display patient age derived from their birthdate using the clinic's Manila date. Show missing birthdates as Not provided; age stays derived rather than editable. Display clinical staff sex from their account, allow editing Male/Female, and persist through the existing profile endpoint without changing license verification status.

- [x] Add backend regression tests for clinic-date age calculation and clinical staff sex updates.
- [x] Add derived age response and persist validated clinical staff sex.
- [x] Update profile cards, staff sex field, and floating Edit Profile button with focus handling.
- [x] Verify focused and full backend tests, frontend lint/type checks, and formatting.

Validation: 23 focused profile tests passed; all 682 backend tests passed (6,287 assertions). TypeScript, targeted ESLint, Prettier, Pint, and diff whitespace checks passed.
