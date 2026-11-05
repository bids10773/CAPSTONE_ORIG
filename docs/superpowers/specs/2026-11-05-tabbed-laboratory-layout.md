# Tabbed laboratory entry

Approved intent: reduce scrolling during CBC, urinalysis and fecalysis input with compact wide tabs, retain values when switching tabs, and keep Save draft and Finalize visible. The design must be easy to undo.

Approach: one shared form state, mounted panels hidden by active tab, responsive compact field rows across up to four desktop columns, and a fixed action bar. Offer Original layout to restore the current all-sections arrangement immediately, without losing inputs. Store only this layout preference in browser storage. Save an exact pre-edit source copy under storage/app/ui-backups for full source rollback.

Alternative: showing all tests side by side still creates a tall page. Tabs use the available width for the selected test and keep other requested tests accessible. Small screens and expanded findings may still need scrolling; never clip fields or errors.

Design: retain clinic moss greens and the existing system font. Use white input surfaces, slate text, and green tab selection. Align labels and references beside inputs; reserve amber/red for findings and errors. Avoid decorative panels. Patient context stays above the tabs. Errors in another tab select the affected tab. Keyboard users can navigate tabs with arrows, Home and End. Enter-to-next-field skips hidden panels.

Scope: UI only. Keep required fields, numerical limits, reference ranges, interpretation rules, verification workflow, API payloads, PDFs, and browser draft ownership unchanged.
