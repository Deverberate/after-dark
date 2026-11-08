# Web Interface Guidelines Reference (Local Copy)
Source: /Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/.agent/skills/web-design-guidelines/references/guidelines.md

Key rules relevant to survey:
- Icon-only buttons need aria-label
- Interactive elements need visible focus: focus-visible
- Never outline-none without focus replacement
- Never transition: all - list properties explicitly
- Non-breaking spaces before units: 10&nbsp;MB, 2.15&nbsp;kg, etc.
- Curly quotes/apostrophes instead of straight quotes/apostrophes
- font-variant-numeric: tabular-nums for number columns/comparisons
- scroll-margin-top on heading anchors
- overscroll-behavior: contain in modals/drawers/sheets
- env(safe-area-inset-*) for full-bleed layouts
- No layout reads in render/event loops (caching getBoundingClientRect)
- Specific link labels (not repeated generic text)
- Preload critical fonts (<link rel="preload" as="font">)
- Skip link targeting main content
