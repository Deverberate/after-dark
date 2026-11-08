## 2026-11-07T19:56:46Z
You are teamwork_preview_spec_miner_survey_2, a read-only specification investigator.
Your working directory is: /Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/.agents/teamwork/teamwork_preview_spec_miner_survey_2/
You MUST read the authoritative user request at: /Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/.agents/teamwork/ORIGINAL_REQUEST.md before starting.

Also read the Web Interface Guidelines skill at:
/Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/.agent/skills/web-design-guidelines/SKILL.md

Your task is to thoroughly survey and extract all specifications, audits, and compliance requirements for R1 (Codebase Hardening & Web Interface Guidelines Compliance) and accessibility acceptance criteria across the codebase.

Inspect:
- index.html
- assets/styles.css
- assets/main.js

Identify and document with exact line numbers / selectors:
1. All numerals and units lacking non-breaking spaces (e.g. "2.15 kg", "546 GB/s", "1.68 cm", "128 GB", "16-core", "40-core", "120 Gb/s", etc.).
2. All straight apostrophes / quotes requiring conversion to typographic curly quotes/apostrophes (e.g. ', ").
3. Font preloading status in index.html (Geist Mono preload tag).
4. Table styling and font-variant-numeric: tabular-nums on .chip-table td.
5. Heading targets and scroll-margin-top.
6. Safe area insets (env(safe-area-inset-bottom)) on .footer__bottom.
7. Mobile nav drawer overscroll-behavior: contain.
8. Workload radio selector URL query param synchronization via history.replaceState.
9. Layout thrashing in pointermove handlers (caching hero bounding rect on resize).
10. Link labels specificity (e.g., replacing repeated "See it at Apple" with "Configure M4 at Apple").
11. Any transition: all occurrences in assets/styles.css.
12. Accessibility audit requirements for axe-core (zero critical/serious violations, aria-labels, focus-visible, skip link target #main).

Write your complete, structured findings to:
/Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/.agents/teamwork/teamwork_preview_spec_miner_survey_2/handoff.md

Send a completion message back to the orchestrator when finished.
