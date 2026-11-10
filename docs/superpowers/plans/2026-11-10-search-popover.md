# Non-modal global search implementation plan

**Goal:** Replace the global search modal with a responsive dropdown anchored to the search input, without a backdrop or focus trap. Empty input shows only recent searches; typed input shows permission-scoped matching results.

**Design and architecture:** Keep the dashboard search input visible. Render a bounded, portaled dropdown below its measured position and clamp it inside the viewport. Outside pointer/focus events and Escape dismiss it. Preserve Ctrl/Cmd+K, keyboard selection, category filtering, dark mode, and stale-response protection. Permit single-character matching. Save up to six successful search terms in a dedicated server-side cache, keyed by session, user, role, and company; save no result names, record bodies, or URLs. Revalidate history against current category and record visibility each time it is read. Replaying a term performs a fresh search.

**Constraints:** No new dependencies or database migration. Preserve existing role scopes and policies. Never display cached results/history after identity, role, or company changes. History should not block normal navigation when its save fails.

- [x] Add backend tests for single-character search, empty metadata/history, deduplicated bounded history, cross-user and role/company isolation, and permission revocation.
- [x] Extract reusable category validation and scoped group lookup within `GlobalSearchController`; add atomically updated recent-history cache read/write and a throttled authenticated POST route.
- [x] Replace the modal in `global-search.tsx` with a visible input and anchored non-modal panel, history replay, keyboard controls, and outside dismissal.
- [x] Extend frontend interaction tests for empty-history-only rendering, first-character search, history replay, Escape/outside dismissal, no modal/backdrop, and identity cleanup.
- [x] Run focused backend/frontend tests, lint, type checks, formatting, and build. Obtain read-only code review and resolve important findings.

## Implementation decisions and review

History entries expire after one day and store only query/category pairs. A dedicated cache plus atomic locks prevents page navigation and notification polling from overwriting recent terms through shared session saves. A regression test recreates a stale session payload save. Reads recheck current record/category access. Session-specific keys also prevent another browser session from reading the history.

The portal explicitly supports Tab into controls, Shift+Tab back to the input, and Tab onward to dashboard controls. ResizeObserver, scroll/resize listeners, and visual viewport events keep the panel attached and bounded.

Verification: 49 backend tests (181 assertions) and 14 frontend tests passed. Read-only review found no unresolved important issues after the history-race and focus fixes. Manual browser/screen-reader verification is unavailable.

Final verification: TypeScript, scoped ESLint, Prettier, Pint, diff whitespace checks, and the production build passed.
