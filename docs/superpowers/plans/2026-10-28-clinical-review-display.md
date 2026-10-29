# Clinical Review Display Plan

**Goal:** Show adult BMI classifications consistently, integrate intake measurements into the doctor's physical examination, and make medical history and findings prominent in authorized clinical views.

**Design:** Keep the clinic's moss and slate palette and existing typography. Use full-width sections, larger headings, readable paragraphs, and clear spacing. Reuse read-only intake and history/findings components between the examination form and clinical record views. Keep patient/company data restrictions unchanged. Use WHO adult categories: underweight <18.5, normal weight <25, overweight <30, obesity >=30. Show no category for missing or invalid BMI.

- [x] Test BMI boundaries, read-only measurement rendering, and complete history/findings rendering.
- [x] Add shared BMI and clinical review display components.
- [x] Integrate measurements and findings into one doctor examination section; remove editable/draft-backed measurement state.
- [x] Show prominent clinical history and findings in authorized appointment and final evaluation views.
- [x] Verify frontend tests, access tests, TypeScript, lint, formatting, and production build.

Validation: 14 frontend tests and 37 workflow/access tests pass. TypeScript, targeted ESLint, Prettier, PHP formatting, diff checks, and the production build pass. Clinical details and latest intake data remain restricted to authorized doctors and administrators in the appointment view.
