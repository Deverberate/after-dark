# Milestone 1 Adversarial Challenge Report: Accessibility & Responsive Layout

**Agent**: `teamwork_preview_challenger_m1_2` (critic, specialist)  
**Parent Agent**: `f8930113-fe72-4be1-b403-7cea67b7c275`  
**Working Directory**: `/Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/.agents/teamwork/teamwork_preview_challenger_m1_2/`  
**Date**: 2026-11-08T03:11:00Z  
**Verdict**: **REPORT_DEFECT**  

---

## Challenge Summary

- **Overall Risk Assessment**: **HIGH**
- **Core Findings**:
  1. **Axe-Core Audit Failure on Non-Desktop Viewports (Serious Violation)**: While axe-core reports 0 critical/serious violations on Desktop (1440×900), it reports a **SERIOUS** accessibility violation (`scrollable-region-focusable`, WCAG 2.1.1 Level A) on Tablet (768×1024), Mobile SE (375×667), and Mobile Modern (390×844) viewports. The `.chip-table-wrap` element enables horizontal scrolling (`overflow-x: auto`) for the 760px/680px table, but lacks `tabindex="0"`, preventing keyboard-only users from scrolling the table.
  2. **Mobile Touch Target Sizing (Web Interface Guidelines / WCAG 2.5.8)**: 27 interactive controls on mobile measure under the required 44×44px minimum bounding box. Critically, all 6 Wayne Tech inspection pins measure 32×32px, the header `#audio-toggle` measures 36px in height, `.brand` measures 32px in height, footer toggles `#motion-toggle` and `.footer__audio` measure 30.9px in height, and footer navigation links measure 15px in height with insufficient vertical touch separation.
  3. **Verified Correctness Areas**:
     - Narrow viewport (320px) horizontal overflow: Confirmed no horizontal scrollbar (`scrollWidth <= clientWidth`, 320px = 320px). Background overflow is cleanly contained via `.hero { overflow: clip; }`.
     - Skip link functionality: Confirmed skip link activates with Enter, moves focus to `#main` (`document.activeElement.id === 'main'`), and subsequent `Tab` keystroke smoothly continues into `#main` content (`a.btn--solid[href="#silicon"]`), without jumping back to header navigation.

---

## 1. Observation

Direct empirical observations obtained from executing the adversarial test harness (`tests/adversarial-a11y-responsive.spec.js`) and analyzing the codebase:

### 1.1 Axe-Core Audit Multi-Viewport Results
Ran axe-core across 4 distinct viewports (`Desktop 1440x900`, `Tablet 768x1024`, `Mobile SE 375x667`, `Mobile Modern 390x844`):
- **Desktop (1440×900)**: **PASS** (0 critical, 0 serious violations).
- **Tablet (768×1024)**: **FAIL** — 1 serious violation:
  ```json
  {
    "id": "scrollable-region-focusable",
    "impact": "serious",
    "help": "Scrollable region must have keyboard access",
    "nodes": [
      {
        "html": "<div class=\"chip-table-wrap reveal\">",
        "target": [".chip-table-wrap"]
      }
    ]
  }
  ```
- **Mobile SE (375×667)**: **FAIL** — 1 serious violation (`scrollable-region-focusable` on `.chip-table-wrap`).
- **Mobile Modern (390×844)**: **FAIL** — 1 serious violation (`scrollable-region-focusable` on `.chip-table-wrap`).

### 1.2 Root Cause of `scrollable-region-focusable`
- `index.html:370`:
  ```html
  <div class="chip-table-wrap reveal">
    <table class="chip-table">
  ```
- `assets/styles.css:1333-1342` and `assets/styles.css:2947-2949`:
  ```css
  .chip-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--line);
    background: rgba(5, 6, 7, 0.42);
    -webkit-overflow-scrolling: touch;
  }
  .chip-table {
    width: 100%;
    min-width: 760px;
  }
  @media (max-width: 480px) {
    .chip-table {
      min-width: 680px;
    }
  }
  ```
- On screens narrower than 760px, `.chip-table-wrap` generates an active scrollable container (`scrollWidth > clientWidth`). Because `.chip-table-wrap` is a generic `<div>` without `tabindex="0"`, keyboard users cannot focus the region to pan across the table columns using arrow keys.

### 1.3 Narrow Viewport 320px Responsive Layout
- Evaluated layout metrics at 320×568:
  ```json
  {
    "clientWidth": 320,
    "scrollWidth": 320,
    "bodyScrollWidth": 320,
    "windowWidth": 320,
    "hasHorizontalScrollbar": false
  }
  ```
- Text containing non-breaking spaces (`&nbsp;` and `&#8209;`) does not break container boundaries.
- `.hero` declares `overflow: clip` (`assets/styles.css:722`), safely containing `.hero__signal` (`rectRight: 365px`) without inducing horizontal page scrolling.

### 1.4 Skip Link Navigation and Keyboard Continuation
- At page load, pressing `Tab` focuses `<a class="skip-link" href="#main">`.
- Element becomes visible via `transform: translateY(0)` (`assets/styles.css:227`).
- Pressing `Enter` updates URL to `http://127.0.0.1:3000/#main` and shifts document focus to `<main id="main" tabindex="-1">`.
- Pressing `Tab` immediately thereafter moves focus to the first interactive element inside `#main`:
  ```json
  {
    "tagName": "A",
    "id": "",
    "className": "btn btn--solid",
    "href": "#silicon",
    "isInsideMain": true
  }
  ```
- Focus continuation is confirmed: focus does not wrap back to header brand or mobile menu toggle.

### 1.5 Mobile Touch Target Dimensions (375×667 & 390×844)
Measured bounding box dimensions of all 33 visible interactive controls on mobile viewports:
- **Total interactive elements**: 33
- **Elements failing 44×44px bounding box**: 27 (81.8%)
- Key undersized elements:
  1. `button.pin` (6 instances): exactly **32.0px × 32.0px** (`assets/styles.css:2990-2991`).
  2. `button#audio-toggle` (header): **97.4px × 36.0px** (height fails 44px).
  3. `a.brand` (home link): **118.0px / 133.0px × 32.0px** (height fails 44px).
  4. `button#die-toggle`: **85.9px × 37.8px** (height fails 44px).
  5. `button#motion-toggle` (footer): **93.8px × 30.9px** (height fails 44px).
  6. `button.footer__audio` (footer): **100.3px × 30.9px** (height fails 44px).
  7. `a.model__link` (3 instances): **165.1px / 192.8px × 15.5px** (height fails 44px).
  8. `a.footer__top-link`: **82.0px × 15.0px** (height fails 44px).
  9. `.footer__col a` (6 index links): height is **15.0px**, with vertical spacing < 12px between adjacent links.

---

## 2. Logic Chain

1. **Axe-Core False-Negative in Worker Verification**:
   - *Observation*: Worker's test `tests/verify.spec.js:489` ran axe-core solely with the Playwright config default viewport (`1440×900`), where `.chip-table-wrap` client width exceeds the 760px minimum width of `.chip-table`.
   - *Reasoning*: Because the element does not overflow at 1440px, the browser scroll container is inert, and axe-core does not trigger `scrollable-region-focusable`. However, when viewed on tablet (768px) or mobile devices (375px/390px), horizontal overflow activates. Under WCAG 2.1.1 (Keyboard - Level A), any scrollable region without focusable content must itself be focusable.
   - *Inference*: The worker's claim of "zero critical or serious violations across viewports" is false for all responsive viewports below 760px.
2. **Impact of `scrollable-region-focusable`**:
   - *Observation*: `.chip-table-wrap` has no `tabindex="0"`, no `role="region"`, and no `aria-label`.
   - *Reasoning*: Motor-impaired or keyboard-only users navigating on laptop/tablet viewports cannot focus the container to view M4 Max specifications on the right side of the comparison matrix.
   - *Inference*: This is a genuine, reproducible **SERIOUS** accessibility defect.
3. **Touch Target Non-Conformance on Mobile**:
   - *Observation*: Worker updated `.menu-toggle` to `min-width: 44px; min-height: 44px;` in `assets/styles.css:2546`, but left all `.pin` buttons at `width: 32px; height: 32px`, `#audio-toggle` at 36px height, `.brand` at 32px height, and footer toggle buttons at 30.9px height.
   - *Reasoning*: Web Interface Guidelines rule: *"Ensure touch targets are at least 44×44 CSS pixels."* Apple HIG guidelines recommend 44×44pt for touch targets. While isolated pins may technically satisfy the narrower WCAG 2.5.8 spacing exception (24px radius), controls like `.footer__bottom` toggle buttons (height 30.9px, placed side-by-side) and footer navigation links (height 15px, vertical gap < 12px) fail both 44×44px standards and WCAG 2.5.8 spacing requirements.

---

## 3. Caveats

- **Narrow Viewport (320px) Robustness**: The page does **NOT** suffer from horizontal scrollbar blowouts at 320px. The non-breaking spaces introduced in M1 wrap cleanly within inline spans without pushing container widths beyond 320px.
- **Skip Link Implementation**: The skip link implementation is fully compliant with WCAG 2.4.1; keyboard continuation seamlessly moves into `#main`.
- **Review-Only Constraint**: As an adversarial challenger, I do not modify implementation code directly; these defects are formally reported for remediation by a worker.

---

## 4. Challenges & Concrete Defect Findings

### [High] Challenge 1: Axe-Core `scrollable-region-focusable` on Tablet & Mobile Viewports
- **Rule**: WCAG 2.1.1 Keyboard (Level A), WCAG 2.1.3 Keyboard (No Exception - Level AAA)
- **Axe Rule ID**: `scrollable-region-focusable` (Impact: `serious`)
- **Failing Element**: `index.html:370` (`<div class="chip-table-wrap reveal">`)
- **Attack Scenario**: Keyboard user visits on iPad (768px) or mobile device (375px/390px). User tabs through the page. The user reaches the chip comparison table but cannot focus the scroll container to pan right to read M4 Max benchmark figures.
- **Remediation**:
  In `index.html:370`, update:
  ```html
  <div class="chip-table-wrap reveal" tabindex="0" role="region" aria-label="Apple Silicon M4 family comparison table">
  ```
  And in `assets/styles.css`, ensure `.chip-table-wrap:focus-visible` displays an accessible focus ring (`outline: 2px solid var(--red-bright); outline-offset: -2px;`).

### [Medium] Challenge 2: Mobile Touch Targets Sub-44×44px
- **Rule**: Web Interface Guidelines (Touch & Interaction), Apple HIG (44×44pt), WCAG 2.5.8 Target Size
- **Failing Elements**:
  1. `assets/styles.css:2990`: `.pin` (`width: 32px; height: 32px`). Needs hit-target expansion via pseudo-element:
     ```css
     .pin::after {
       content: "";
       position: absolute;
       inset: -6px; /* expands 32px to 44px */
     }
     ```
  2. `assets/styles.css`: `#audio-toggle` in header has height 36px. Set `min-height: 44px; min-width: 44px;`.
  3. `assets/styles.css`: `.brand` has height 32px. Set `min-height: 44px; display: inline-flex; align-items: center;`.
  4. `assets/styles.css`: `.motion-toggle` and `.footer__audio` in footer have height 30.9px. Set `min-height: 44px; min-width: 44px;`.
  5. `assets/styles.css`: `.footer__nav a` has height 15px. Add `padding-block: 0.5rem; display: inline-block;` to provide comfortable touch targets and spacing.

---

## 5. Stress Test Results Summary

| Test Scenario | Viewport | Expected | Actual | Status |
|---|---|---|---|---|
| Axe-core accessibility audit | Desktop (1440×900) | 0 critical/serious | 0 critical/serious | **PASS** |
| Axe-core accessibility audit | Tablet (768×1024) | 0 critical/serious | 1 serious (`scrollable-region-focusable`) | **FAIL** |
| Axe-core accessibility audit | Mobile SE (375×667) | 0 critical/serious | 1 serious (`scrollable-region-focusable`) | **FAIL** |
| Axe-core accessibility audit | Mobile Modern (390×844) | 0 critical/serious | 1 serious (`scrollable-region-focusable`) | **FAIL** |
| Narrow viewport overflow | Mobile 320px | `scrollWidth <= clientWidth` | `320px <= 320px`, no scrollbar | **PASS** |
| Skip link activation & focus | Desktop 1440×900 | Focus on `#main` | `document.activeElement.id === 'main'` | **PASS** |
| Skip link keyboard continuation | Desktop 1440×900 | Focus continues into `#main` | Focus lands on `a.btn--solid[href="#silicon"]` | **PASS** |
| Mobile touch targets (>= 44×44px) | Mobile SE (375×667) | 0 controls < 44×44px | 27 controls < 44×44px | **FAIL** |
| Mobile touch targets (>= 44×44px) | Mobile Modern (390×844) | 0 controls < 44×44px | 27 controls < 44×44px | **FAIL** |

---

## 6. Unchallenged Areas

- **Audio synthesis playback on physical iOS device**: Browser audio context interaction requires user gesture and was tested in headless Chromium emulation rather than physical Safari iOS hardware.
- **Physical device haptic vibration**: The `navigator.vibrate` API was checked for graceful degradation, but physical haptic motor pulses cannot be felt in virtual headless environments.

---

## 7. Verification Method

To independently reproduce all empirical findings:

1. **Run Full Adversarial Playwright Spec**:
   ```bash
   npx playwright test tests/adversarial-a11y-responsive.spec.js --workers=1
   ```
   *Expected Outcome*: 3 tests pass (Desktop axe-core, 320px overflow, Skip link continuation); 5 tests fail (Tablet axe-core, Mobile SE axe-core, Mobile Modern axe-core, 375px touch targets, 390px touch targets).

2. **Isolate Axe-Core Tablet Failure**:
   ```bash
   npx playwright test tests/adversarial-a11y-responsive.spec.js -g "Tablet"
   ```
   *Expected Output*: Fails with `scrollable-region-focusable` on `.chip-table-wrap`.

3. **Isolate Mobile Touch Target Failures**:
   ```bash
   npx playwright test tests/adversarial-a11y-responsive.spec.js -g "375x667"
   ```
   *Expected Output*: Fails with 27 controls smaller than 44×44px.
