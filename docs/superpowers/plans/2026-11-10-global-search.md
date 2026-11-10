# Global search implementation plan

**Goal:** Match the supplied search reference using clinic categories and preserve server-side access boundaries.

**Design:** Keep the existing dialog and top-bar entry points. Use a white, lightly bordered panel, an input row, compact category buttons, sentence-case group headings, and dense result rows. Highlight literal query matches in pale blue. Keep existing typography and dark-mode tokens. Show clinic categories rather than the reference's unrelated campaigns and products.

**Architecture:** The search endpoint supplies permitted categories even before a query is entered. Optional category filtering never broadens the existing role-scoped queries. Result destinations use appointment policies to choose editing versus record viewing. React renders only results belonging to the current query, category, and user.

**Constraints:** Preserve unrelated working changes. No new dependencies. Server authorization remains authoritative. Keep mobile and keyboard support, loading, errors, cancellation, and empty states.

## Tasks

- [x] Extend `tests/Feature/GlobalSearchTest.php` with category visibility for all seven roles, forbidden-category requests, filtered results, and policy-aware result links. Run the tests before implementing.
- [x] Update `app/Http/Controllers/GlobalSearchController.php` to return allowed categories, validate optional category filters, reject unsupported roles, and select action URLs using appointment policies.
- [x] Add `resources/js/components/global-search-results.tsx` for category buttons, highlighted text, and compact grouped results. Cover visible categories, literal safe highlights, group filtering, and selection with frontend tests.
- [x] Update `resources/js/components/global-search.tsx` to request server categories, apply category filters, prevent stale results, reset on close/user changes, and retain keyboard navigation and focus restoration.
- [x] Run search permission tests, frontend tests, formatting, lint, and type checks. Review the scoped diff for authorization, keyboard behavior, mobile sizing, stale requests, and dark mode.

## Review focus

Cross-account records; unauthorized categories supplied directly to the API; view-only records linking to edit screens; obsolete responses after changing query/category/user; HTML or regex characters in highlighted text; keyboard selection after filtering.

## Verification

- Backend: 29 search tests passed (93 assertions).
- Frontend: seven tests passed, including literal highlighting, category controls, stale response cancellation, filtering and keyboard navigation, and identity changes.
- Production build, TypeScript, scoped ESLint, Prettier, Pint, and diff whitespace checks passed.
- Read-only review identified incomplete patient context for laboratory policies; selected role/sex and covered both eligible and ineligible patients.
- Browser screenshots and manual screen-reader testing were not available in this environment.

## Search category extension

Implemented the requested Patients rename and separate Staff, Certificates, and Documents categories. Staff directory search is administrator-only. Certificate search follows its viewAny policy and limits physicians to certificates they attend. Document search reuses staff visibleTo scopes and the patient's own releaseVisible documents. Patient certificate availability remains through their authorized documents screen. No clinical diagnosis text or certificate verification tokens are returned.

Verification: 43 backend tests (128 assertions), eight frontend tests, TypeScript, scoped ESLint, Prettier, and Pint passed. Read-only follow-up review found no important or critical issues.
