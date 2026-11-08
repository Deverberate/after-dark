# Test Infrastructure Specification: M4 After Dark

## 1. Test Philosophy: Opaque-Box, Requirement-Driven Verification

The testing harness for the "M4 After Dark" interactive experience is built strictly upon **opaque-box, requirement-driven verification**:
- **Interface & Behavior, Not Implementation**: Tests never probe private module closures, internal local variables, or implementation scaffolding. Instead, verification operates strictly at observable boundaries: DOM structure, computed CSS properties, ARIA roles/states, URL query strings, localStorage state, audio synthesis contracts, keyboard and pointer event reactions, and automated accessibility tree compliance.
- **Progressive Testability & Graceful Escalation**: During progressive milestone development (M1 to M5), tests are partitioned into tiers and distinct feature suites. Each test asserts verifiable contracts derived directly from `PROJECT.md` and `ORIGINAL_REQUEST.md`. Features awaiting implementation fail with clear, informative diagnostic assertions that provide actionable feedback to implementing agents, while passing baseline features confirm no regressions.
- **Independence & Isolation**: Every test case runs independently with a clean browser context, freshly provisioned localStorage, and independent URL routing. Tests do not rely on execution order or shared mutable global state.
- **Adversarial & Edge-Condition Testing**: Tests explicitly evaluate boundary conditions: invalid URL query parameters, rapid keyboard interactions (`Escape` handling, focus return), collision avoidance at page boundaries, touch target sizing on mobile viewports, and OS-level `prefers-reduced-motion` synchronization.

---

## 2. Feature Inventory Mapping (All 35 Features Across Tiers 1–4)

Each feature from `PROJECT.md` is mapped to an execution tier, milestone, test suite describe block, and its authoritative expected output source.

| # | Feature Name | Milestone | Tier | Test Describe Block | Authoritative Spec Source | Expected Behavior |
|---|--------------|-----------|------|---------------------|---------------------------|-------------------|
| 1 | Non-Breaking Unit Spaces | M1 | Tier 1 | `Tier 1: Static Hardening & Guidelines` | `ORIGINAL_REQUEST.md` § R1 | All units (kg, GB/s, Gb/s, cm, mm, etc.) preceded by non-breaking space `\u00A0` |
| 2 | Typographic Curly Quotes | M1 | Tier 1 | `Tier 1: Static Hardening & Guidelines` | `ORIGINAL_REQUEST.md` § R1 | Meta description & copy use typographic curly quotes (`’`), not straight apostrophes |
| 3 | Geist Mono Font Preload | M1 | Tier 1 | `Tier 1: Static Hardening & Guidelines` | `ORIGINAL_REQUEST.md` § R1 | `<link rel="preload" href="assets/fonts/geist-mono.woff2" as="font" ...>` present in `<head>` |
| 4 | Tabular Numbers on Chip Table | M1 | Tier 1 | `Tier 1: Static Hardening & Guidelines` | `ORIGINAL_REQUEST.md` § R1 | `.chip-table td, .chip-table th` have computed `font-variant-numeric: tabular-nums` |
| 5 | Heading Scroll Margin | M1 | Tier 1 | `Tier 1: Static Hardening & Guidelines` | `ORIGINAL_REQUEST.md` § R1 | Section headings with IDs have computed `scroll-margin-top >= 4rem` |
| 6 | Mobile Nav Containment | M1 | Tier 1 | `Tier 1: Static Hardening & Guidelines` | `ORIGINAL_REQUEST.md` § R1 | Mobile `.nav` drawer has computed `overscroll-behavior: contain` |
| 7 | Footer Safe Area Padding | M1 | Tier 1 | `Tier 1: Static Hardening & Guidelines` | `ORIGINAL_REQUEST.md` § R1 | `.footer__bottom` has `padding-bottom` referencing `env(safe-area-inset-bottom)` |
| 8 | Workload URL Query Param Sync | M1 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R1, Acceptance | Workload radio selection updates `?workload=...` via `history.replaceState`; page reload restores radio |
| 9 | Hero Pointerglow Layout Cache | M1 | Tier 1 | `Tier 1: Static Hardening & Guidelines` | `ORIGINAL_REQUEST.md` § R1 | Hero bounding rect cached on resize, no layout thrashing on pointermove |
| 10 | Specific Apple Link Labels | M1 | Tier 1 | `Tier 1: Static Hardening & Guidelines` | `ORIGINAL_REQUEST.md` § R1 | Model CTA links contain distinct model names ("Configure M4 Pro at Apple", etc.) |
| 11 | CSS Transition Property Audit | M1 | Tier 1 | `Tier 1: Static Hardening & Guidelines` | `ORIGINAL_REQUEST.md` § Acceptance | Zero occurrences of `transition: all` or `transition:all` in `assets/styles.css` |
| 12 | Layered Scroll Entry Stagger | M2 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R2 | Staggered entry classes/styles applied with at least 3 distinct timing offsets per section |
| 13 | Hero Image Parallax Depth | M2 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R2 | Hero image transforms on scroll without causing layout reflow |
| 14 | Magnetic & Scale Micro-Interactions | M2 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R2 | Interactive buttons/cards apply scale/transform micro-interactions |
| 15 | Stat Counter Interpolation | M2 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R2 | Stats/counters interpolate from 0 to target number on scroll intersection |
| 16 | Scroll-Triggered Benchmark Fills | M2 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R2 | Benchmark bars animate width from 0% to specified percentage upon reveal |
| 17 | Tactical Heading Glitch/Scanline | M2 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R2 | Section headings execute tactical glitch/scanline animation class on entry |
| 18 | Vibration API Haptics | M2 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R2 | `navigator.vibrate` called on workload select, pin toggle, and HUD toggle |
| 19 | 60fps Animation Budget & Reduced Motion | M2 | Tier 3 | `Tier 3: Pairwise & System Integration` | `ORIGINAL_REQUEST.md` § R2, Acceptance | Transitions/animations completely suppressed when `.motion-off` or `prefers-reduced-motion` |
| 20 | Diagnostic Reticle Pins Geometry | M3 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R3 | At least 6 pins rendered (3 on hero `.hero__frame`, 1 per 3 `.gallery__card` / `.gallery__media`) |
| 21 | Reticle Tactical Lock-On Effect | M3 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R3 | Pins feature animated SVG brackets / radar rings with active lock-on state |
| 22 | Spec Tooltip Callout Cards | M3 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R3 | Tooltips render real M4 Max specifications (Liquid Retina XDR, Thunderbolt 5, etc.) |
| 23 | Pin Keyboard & ARIA Accessibility | M3 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R3 | `aria-expanded` toggles; Tab focus works; Enter/Space activates; Escape key dismisses |
| 24 | Fixed HUD Telemetry Tray | M4 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R4 | Fixed bottom-right HUD displaying section name, scroll %, Gotham time, audio status |
| 25 | Expandable Diagnostic Panel | M4 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R4 | Collapsed tray expands on click/Enter to show gauges, memory stream, quick-nav |
| 26 | HUD Footer Collision Avoidance | M4 | Tier 3 | `Tier 3: Pairwise & System Integration` | `ORIGINAL_REQUEST.md` § R4 | Dynamic clearance above `.site-footer` when scrolling to page bottom |
| 27 | HUD Mobile & Keyboard Accessibility | M4 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R4 | HUD toggled with keyboard (`Enter`/`Space`), touch-target compliant, dismissible with `Escape` |
| 28 | Programmatic Web Audio Synthesizer | M5 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R5, PROJECT.md | `window.wayneAudio` instance available with Web Audio API synthesis methods |
| 29 | Four Distinct Sound Effects | M5 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R5 | Synthesizes click, chirp, sweep, and lock sound profiles |
| 30 | Audio Preference & Muted Default | M5 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R5 | Defaults to muted on initial visit; persists toggle in `localStorage['after-dark-audio']` |
| 31 | Audio OS Reduced-Motion Sync | M5 | Tier 3 | `Tier 3: Pairwise & System Integration` | `ORIGINAL_REQUEST.md` § R5 | Audio disabled when `prefers-reduced-motion: reduce` is active |
| 32 | Integrated Audio Toggle | M5 | Tier 2 | `Tier 2: Component & State Transitions` | `ORIGINAL_REQUEST.md` § R5 | Visible audio toggle button in telemetry HUD and/or footer controls |
| 33 | E2E Test Suite Infrastructure | E2E-T1 | Tier 1 | Project Harness (`package.json`, configs) | PROJECT.md § Architecture | Playwright + Axe runner configured with headless server & reports |
| 34 | Tier 1–4 Verification Tests | E2E-T1 | Tiers 1-4 | `tests/verify.spec.js` | PROJECT.md § Milestones | Comprehensive opaque-box test suite authored and executable |
| 35 | 100% E2E Pass & Adversarial Hardening | M6 | Tier 4 | `Tier 4: Real-World Scenarios` | PROJECT.md § Milestones | All 34 features passing 100% with stress testing and visual screenshots |

---

## 3. Real-World Application Scenarios (Tier 4)

The test harness exercises five authentic user personas and deployment situations:

### Scenario 1: Executive Dark-Room Review / Wayne Tech Showcase
- **Context**: A senior design director evaluates the experience on a 1440×900 display in a low-light presentation room.
- **Path**:
  1. Loads root URL with clean cache.
  2. Glances at the hero section, observing tactical typography and Geist Mono rendering.
  3. Activates the audio toggle to enable tactical sound feedback.
  4. Clicks an inspection pin on the M4 Max hero chassis, verifying the lock-on bracket animation, spec tooltip ("Liquid Retina XDR"), and acoustic chirp.
  5. Scrolls through `#machine`, `#silicon`, `#proof`, `#armor`, `#specs`, `#models`, verifying that stat counters animate smoothly and benchmark bars fill dynamically.
  6. Opens the telemetry tray, checks Gotham local time and simulated CPU/GPU gauges, and uses quick-nav to return to `#hero`.
  7. Selects the "3D VFX & Virtual Production" workload, observing URL param update to `?workload=3d-rendering` and acoustic tactical lock.

### Scenario 2: Accessibility-First Keyboard & Screen Reader Operator
- **Context**: A blind or motor-impaired user navigates the site exclusively using keyboard focus and assistive technology.
- **Path**:
  1. Navigates into the document using `Tab`.
  2. Hits the `.skip-link`, verifying that focus transfers immediately to `#main`.
  3. Tabs through interactive controls, confirming that every button, link, radio, and pin possesses high-contrast `:focus-visible` outlines.
  4. Reaches an inspection pin: screen reader announces `button`, `aria-expanded="false"`, and descriptive `aria-label`.
  5. Presses `Enter` to expand tooltip; verifies `aria-expanded="true"` and live-region / tooltip association.
  6. Hits `Escape`; verifies tooltip closes and focus returns gracefully to the pin button without loss of context.
  7. Runs automated `axe-core` evaluation to guarantee zero critical or serious WCAG 2.1 AA violations.

### Scenario 3: High-Stress Mobile Field Operator
- **Context**: An engineer on a mobile viewport (390×844 iPhone 14 Pro emulation) inspecting machine specs in the field.
- **Path**:
  1. Loads viewport at 390×844 with touch enabled.
  2. Opens the mobile navigation drawer, verifying `overscroll-behavior: contain` prevents body rubber-banding.
  3. Verifies that all touch targets (buttons, links, radio pills) satisfy minimum size requirements (>= 44×44px).
  4. Scrolls to the bottom of the page, verifying `.footer__bottom` respects `env(safe-area-inset-bottom)`.
  5. Confirms that the HUD telemetry tray repositions cleanly above the footer without obscuring critical copyright or regulatory disclosures.

### Scenario 4: Low-Power / Reduced-Motion Stealth Mode
- **Context**: A user with vestibular disorders or battery-conservation settings has `prefers-reduced-motion: reduce` configured at the OS level.
- **Path**:
  1. Test context loads page with `reducedMotion: 'reduce'`.
  2. Verifies that CSS animations and transitions are disabled or set to `0.001ms`.
  3. Verifies that Web Audio synthesis does not fire automatic acoustic sweeps or pulses.
  4. Toggles the in-page Motion switch to verify user override precedence.

### Scenario 5: Direct Deep-Linking & Workload State Restoration
- **Context**: An engineer receives a direct link to the optimal configuration for AI model training (`?workload=ai-training`).
- **Path**:
  1. Browser loads directly to `/?workload=ai-training`.
  2. Page initialization script parses query parameters and automatically checks the corresponding radio input.
  3. The recommended M4 Max configuration card ("Neural Beast") is highlighted.
  4. User changes workload to `game-dev`; URL updates immediately via `history.replaceState` to `/?workload=game-dev` without full page reload.

---

## 4. Coverage Thresholds & Quality Gates

The test suite enforces explicit quantitative coverage thresholds:

1. **Tier 1 (Static Hardening & Guidelines)**:
   - >= 5 assertions per feature group (Accessibility, Typography/Units, Head/Preload, CSS Transitions, Semantic DOM).
   - Zero tolerance for `transition: all`.
   - 100% adherence to non-breaking spaces before units.
2. **Tier 2 (Component & Boundary States)**:
   - Full boundary evaluation of interactive components:
     - 6+ inspection pins (3 hero + 1 per armor card).
     - HUD tray in collapsed, expanded, and dismiss states.
     - Audio toggle in muted, unmuted, and reloaded states.
     - Workload selector radio states across all options (`code-compilation`, `3d-rendering`, `ai-training`, `video-color`).
3. **Tier 3 (Pairwise & System Integration)**:
   - Cross-feature matrix:
     - Motion Off $\times$ Audio On/Off
     - Workload Change $\times$ Telemetry HUD Recommendation
     - Telemetry Expanded $\times$ Scroll into Footer Boundary
     - Inspection Pin Open $\times$ Window Resize $\times$ Escape Key
4. **Tier 4 (Real-World Application Scenarios & Visual Regressions)**:
   - Complete execution of Scenarios 1–5.
   - High-fidelity visual snapshot captures across all 7 major sections (`#hero`, `#machine`, `#silicon`, `#proof`, `#armor`, `#specs`, `#models`).
   - Automated axe-core scan with 0 critical and 0 serious violations.
