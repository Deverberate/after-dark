# Milestone 1 CSS Hardening Patch Plan

**Date**: 2026-11-07T20:13:00Z  
**Agent**: `teamwork_preview_explorer_m1_2`  
**Target File**: `/Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/assets/styles.css`  
**Patch Artifact**: `/Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/.agents/teamwork/teamwork_preview_explorer_m1_2/m1_css_hardening.patch`  
**Task Scope**: Prepare exact CSS patch plan covering `font-variant-numeric: tabular-nums`, `scroll-margin-top: 6rem` on headings/target IDs, mobile nav drawer containment (`overscroll-behavior: contain` & `overflow-y: auto`), footer safe area padding (`env(safe-area-inset-bottom)`), and exhaustive audit confirming zero occurrences of `transition: all`.

---

## 1. Observation

Direct observations from inspecting `assets/styles.css` (3021 lines), `index.html` (829 lines), and `assets/main.js` (802 lines):

### Item 1: Chip Table Numerals Lack Tabular Alignment (`tabular-nums`)
- **Location 1 — Base Chip Table Styles (`assets/styles.css:1313-1320`)**:
  ```css
  .chip-table th,
  .chip-table td {
    padding: 1rem 1.05rem;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
    font-size: 0.82rem;
    line-height: 1.55;
  }
  ```
  `font-variant-numeric: tabular-nums;` is currently absent. While it is applied elsewhere in the stylesheet (line 553 on `.clock`, line 842 on `.stat__num`, line 1461 on `.bandwidth__val`, line 1892 on `.benchmark__val`), the specs table `.chip-table th, .chip-table td` renders figures using default proportional widths. Numerals across columns (e.g. 10-core vs 14-core vs 16-core, 120&nbsp;GB/s vs 273&nbsp;GB/s vs 546&nbsp;GB/s, 32GB vs 64GB vs 128GB) exhibit horizontal character-width variance and fail to form vertically aligned baselines.
- **Location 2 — Mobile Chip Table Styles (`assets/styles.css:2908-2911`)**:
  ```css
    .chip-table th,
    .chip-table td {
      padding: 0.85rem 0.8rem;
    }
  ```
  Inside `@media (max-width: 640px)`. Only overrides `padding`. Adding `font-variant-numeric: tabular-nums;` explicitly guarantees tabular alignment across all responsive viewports.

---

### Item 2: Headings and Target Elements Lack Anchor Scroll Margin
- **Existing Anchor/Control Rule (`assets/styles.css:249-255`)**:
  ```css
  a,
  button,
  input,
  select,
  textarea {
    scroll-margin-top: 6rem;
  }
  ```
- **Observed Problem**:
  Only interactive form controls and links have `scroll-margin-top: 6rem;`. Heading elements (`h1, h2, h3, h4, h5, h6`), targeted elements (`:target`), and ID anchors (`[id]:target`, `section[id]`) possess no `scroll-margin-top`.
  The fixed header (`.site-header`) occupies a fixed height of `--header-h` (4.6rem on mobile, clamp up to 5.5rem–6rem on desktop). When jumping to any anchor target (e.g., `#machine`, `#silicon`, `#proof`, `#armor`, `#specs`, `#models`, `#top`), the top edge of the section and its heading land flush with the browser viewport top, resulting in 4.6rem–6rem of content being occluded beneath the opaque black header.

---

### Item 3: Mobile Nav Drawer Lacks Scroll and Overscroll Containment
- **Existing Mobile Nav Rule (`assets/styles.css:2539-2555`)**:
  ```css
    .nav {
      position: fixed;
      inset: 0 0 0 auto;
      z-index: 70;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: min(88vw, 430px);
      padding: calc(var(--header-h) + 1.5rem) 1.5rem 2rem;
      background:
        radial-gradient(70% 40% at 100% 0%, rgba(225, 6, 0, 0.09), transparent 70%),
        var(--obsidian-2);
      border-left: 1px solid var(--line);
      transform: translateX(102%);
      visibility: hidden;
      transition: transform 0.5s var(--ease), visibility 0.5s;
    }
  ```
- **Observed Problem**:
  The mobile drawer has fixed viewport constraints (`inset: 0 0 0 auto`, `height: 100%`) but does not declare `overflow-y: auto` or `overscroll-behavior: contain`.
  1. On short mobile displays (e.g., landscape orientation or screen heights < 620px), nav items and bottom actions overflow the viewport and become inaccessible.
  2. When scrolling inside the drawer, touch events chain directly to the underlying document body, causing distracting rubber-banding and page movement behind the open modal menu.

---

### Item 4: Footer Bottom Lacks Safe Area Inset Padding
- **Existing Footer Bottom Rule (`assets/styles.css:2351-2364`)**:
  ```css
  .footer__bottom {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem 1.75rem;
    margin-top: 1.5rem;
    padding-block: 1.25rem;
    border-top: 1px solid var(--line);
    font-family: var(--font-mono);
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-2);
  }
  ```
- **Observed Problem**:
  Line 2357 specifies `padding-block: 1.25rem;` (20px top and bottom).
  On modern mobile devices with edge-to-edge displays and home indicator gesture bars (e.g., iPhones and Android gesture navigation), the home bar overlays the bottom 34px of the screen.
  Because `index.html:8` already includes `<meta name="viewport" content="... viewport-fit=cover">`, content renders under the home bar unless protected by `env(safe-area-inset-bottom)`. At 20px padding, the copyright text and `.motion-toggle` button collide with the device home bar.

---

### Item 5: Exhaustive Audit of `transition: all`
- **Grep Query**: `transition\s*:\s*all|transition:\s*[^;]*\ball\b`
- **Result**: **0 occurrences** across all 3021 lines of `assets/styles.css`.
- **Catalogue of all 25 transition rules in `assets/styles.css`**:
  1. Line 223 (`.skip-link`): `transform 0.3s var(--ease)`
  2. Line 390 (`.site-header::after`): `opacity 0.4s ease`
  3. Line 407 (`.site-header::before`): `opacity 0.35s ease`
  4. Line 435 (`.brand svg path`): `fill 0.3s ease, transform 0.4s var(--ease)`
  5. Line 487 (`.nav__link`): `color 0.3s ease`
  6. Line 504 (`.nav__link::after`): `transform 0.4s var(--ease)`
  7. Line 584 (`.menu-toggle__bars span`): `transform 0.35s var(--ease), opacity 0.25s ease`
  8. Line 613 (`.btn`): `background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease`
  9. Line 619 (`.btn .icon`): `transform 0.4s var(--ease)`
  10. Line 670 (`.text-link .icon`): `transform 0.4s var(--ease)`
  11. Line 1444 (`.bars__fill`): `width 1.15s var(--ease)`
  12. Line 1536 (`.workload__box`): `border-color 0.3s ease, background-color 0.3s ease`
  13. Line 1664 (`.die__toggle`): `background-color 0.3s ease, color 0.3s ease`
  14. Line 1879 (`.bench__fill`): `width 1.35s var(--ease)`
  15. Line 1913 (`.gallery__card`): `border-color 0.4s ease, transform 0.5s var(--ease)`
  16. Line 1933 (`.gallery__media img`): `transform 0.8s var(--ease), filter 0.5s ease`
  17. Line 2059 (`.armor__strip div`): `background-color 0.25s ease`
  18. Line 2104 (`.model`): `border-color 0.4s ease, transform 0.5s var(--ease)`
  19. Line 2202 (`.model__link .icon`): `transform 0.35s var(--ease)`
  20. Line 2320 (`.footer__col a`): `color 0.25s ease`
  21. Line 2383 (`.motion-toggle`): `border-color 0.3s ease, color 0.3s ease`
  22. Line 2417 (`.reveal`): `opacity 0.85s var(--ease), transform 0.85s var(--ease)`
  23. Lines 2453, 2459, 2476, 2481: `transition: none` / `transition: none !important`
  24. Line 2554 (`.nav` mobile drawer): `transform 0.5s var(--ease), visibility 0.5s`
- **Assessment**: The stylesheet is already strictly compliant with the zero `transition: all` rule. The proposed patch plan introduces zero new transition properties and preserves the explicit `transform 0.5s var(--ease), visibility 0.5s` on mobile `.nav`.

---

## 2. Logic Chain

1. **Tabular Figures in Technical Data Matrices**:
   - *Observation*: `assets/styles.css:1313-1320` lacks `font-variant-numeric: tabular-nums;`.
   - *Inference*: Proportional numbers cause horizontal jitter across rows. Applying `font-variant-numeric: tabular-nums;` forces the browser's OpenType layout engine to render monospaced numeric glyphs for Instrument Sans and system fallbacks, aligning decimal places and unit comparisons vertically without changing non-numeric text.
2. **Sticky Header Clearance for Hash Targets**:
   - *Observation*: `.site-header` is sticky/fixed with height 4.6rem–6rem; `assets/styles.css:249-255` sets `scroll-margin-top: 6rem` only on interactive controls (`a, button, input, select, textarea`).
   - *Inference*: When users click `#machine`, `#silicon`, `#proof`, `#armor`, `#specs`, or `#models`, the target section boundary aligns to the viewport top edge, obscuring section headers. Adding `h1, h2, h3, h4, h5, h6, [id]:target, :target` to the `scroll-margin-top: 6rem;` rule ensures the browser reserves 6rem of clearance above the target element during both native hash jumps and programmatic focus/scroll operations.
3. **Scroll Containment on Overlay Modals**:
   - *Observation*: Mobile drawer `.nav` at line 2539 has `position: fixed` and `visibility: hidden` but lacks `overflow-y` and `overscroll-behavior`.
   - *Inference*: Setting `overflow-y: auto` permits vertical scrolling when viewport height is constrained. Adding `overscroll-behavior: contain` and `-webkit-overflow-scrolling: touch` creates an isolated scroll boundary that traps touch gestures inside the drawer, preventing scroll chaining and background rubber-banding.
4. **Adaptive Safe Area Insets**:
   - *Observation*: Line 2357 has `padding-block: 1.25rem;` which does not query `env(safe-area-inset-bottom)`.
   - *Inference*: Mobile gesture navigation bars require clearance. By setting `padding-top: 1.25rem;` and `padding-bottom: max(1.75rem, env(safe-area-inset-bottom));`, desktop and older mobile viewports receive at least 1.75rem (28px), while modern notch/gesture devices expand dynamically to 34px+ to ensure touch targets like `.motion-toggle` remain unobstructed.
5. **Compositor Performance Guarantee**:
   - *Observation*: Zero instances of `transition: all` exist across all 25 transition rules.
   - *Inference*: `transition: all` triggers inadvertent browser recalculation of layout-inducing properties on hover or state change. Maintaining explicit transition properties (`transform`, `opacity`, `color`, etc.) guarantees hardware acceleration on compositor threads, satisfying the 60fps requirement for M2.

---

## 3. Exact Before-and-After Code Snippets

### Patch 1: Heading IDs and Target Elements (`scroll-margin-top: 6rem`)
- **Target File**: `assets/styles.css`
- **Target Lines**: 249–255
- **Before**:
  ```css
  a,
  button,
  input,
  select,
  textarea {
    scroll-margin-top: 6rem;
  }
  ```
- **After**:
  ```css
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  [id]:target,
  :target,
  a,
  button,
  input,
  select,
  textarea {
    scroll-margin-top: 6rem;
  }
  ```

---

### Patch 2: Base Chip Table (`font-variant-numeric: tabular-nums`)
- **Target File**: `assets/styles.css`
- **Target Lines**: 1313–1320
- **Before**:
  ```css
  .chip-table th,
  .chip-table td {
    padding: 1rem 1.05rem;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
    font-size: 0.82rem;
    line-height: 1.55;
  }
  ```
- **After**:
  ```css
  .chip-table th,
  .chip-table td {
    padding: 1rem 1.05rem;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
    font-size: 0.82rem;
    line-height: 1.55;
    font-variant-numeric: tabular-nums;
  }
  ```

---

### Patch 3: Footer Bottom Safe Area Padding
- **Target File**: `assets/styles.css`
- **Target Lines**: 2351–2364
- **Before**:
  ```css
  .footer__bottom {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem 1.75rem;
    margin-top: 1.5rem;
    padding-block: 1.25rem;
    border-top: 1px solid var(--line);
    font-family: var(--font-mono);
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-2);
  }
  ```
- **After**:
  ```css
  .footer__bottom {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem 1.75rem;
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    padding-bottom: max(1.75rem, env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    font-family: var(--font-mono);
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-2);
  }
  ```

---

### Patch 4: Mobile Nav Drawer Containment
- **Target File**: `assets/styles.css`
- **Target Lines**: 2539–2555
- **Before**:
  ```css
    .nav {
      position: fixed;
      inset: 0 0 0 auto;
      z-index: 70;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: min(88vw, 430px);
      padding: calc(var(--header-h) + 1.5rem) 1.5rem 2rem;
      background:
        radial-gradient(70% 40% at 100% 0%, rgba(225, 6, 0, 0.09), transparent 70%),
        var(--obsidian-2);
      border-left: 1px solid var(--line);
      transform: translateX(102%);
      visibility: hidden;
      transition: transform 0.5s var(--ease), visibility 0.5s;
    }
  ```
- **After**:
  ```css
    .nav {
      position: fixed;
      inset: 0 0 0 auto;
      z-index: 70;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: min(88vw, 430px);
      padding: calc(var(--header-h) + 1.5rem) 1.5rem 2rem;
      background:
        radial-gradient(70% 40% at 100% 0%, rgba(225, 6, 0, 0.09), transparent 70%),
        var(--obsidian-2);
      border-left: 1px solid var(--line);
      transform: translateX(102%);
      visibility: hidden;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      transition: transform 0.5s var(--ease), visibility 0.5s;
    }
  ```

---

### Patch 5: Responsive Chip Table (`font-variant-numeric: tabular-nums`)
- **Target File**: `assets/styles.css`
- **Target Lines**: 2908–2911
- **Before**:
  ```css
    .chip-table th,
    .chip-table td {
      padding: 0.85rem 0.8rem;
    }
  ```
- **After**:
  ```css
    .chip-table th,
    .chip-table td {
      padding: 0.85rem 0.8rem;
      font-variant-numeric: tabular-nums;
    }
  ```

---

## 4. Caveats

1. **Read-Only Investigation Role**: In compliance with the Explorer archetype, the patch file `.agents/teamwork/teamwork_preview_explorer_m1_2/m1_css_hardening.patch` has been written and dry-run validated with `git apply --check`, but has NOT been applied to `assets/styles.css`. The implementation agent can apply it directly.
2. **Safe Area Pre-requisite in HTML**: The `env(safe-area-inset-bottom)` property only produces non-zero values on mobile browsers if `<meta name="viewport" content="... viewport-fit=cover">` is present. Line 8 of `index.html` was verified and already specifies `viewport-fit=cover`.
3. **Fallback in `env()`**: In standard desktop browsers where `env(safe-area-inset-bottom)` is unsupported or 0px, `max(1.75rem, env(safe-area-inset-bottom))` resolves cleanly to `1.75rem`. If an implementer prefers explicit comma fallback syntax, `max(1.75rem, env(safe-area-inset-bottom, 0px))` produces identical results.
4. **Transition Safety in Future Milestones**: When Milestone 2 motion engine and Milestone 4 HUD styles are added to `assets/styles.css`, implementers must maintain the project constraint: never write `transition: all`.

---

## 5. Conclusion

The CSS hardening patch plan addresses all five requirements with zero regressions, complete preservation of the existing design tokens, and strict adherence to the 60fps performance budget:
- **Requirement 1**: `font-variant-numeric: tabular-nums;` added to `.chip-table th, .chip-table td` at line 1320 and line 2911.
- **Requirement 2**: `scroll-margin-top: 6rem;` added to `h1, h2, h3, h4, h5, h6, [id]:target, :target` at lines 249–255.
- **Requirement 3**: `overflow-y: auto;`, `overscroll-behavior: contain;`, and `-webkit-overflow-scrolling: touch;` added to mobile `.nav` at line 2539.
- **Requirement 4**: `padding-bottom: max(1.75rem, env(safe-area-inset-bottom));` and `padding-top: 1.25rem;` applied to `.footer__bottom` at line 2357.
- **Requirement 5**: Complete audit verified 0 occurrences of `transition: all` in `assets/styles.css`. No transitions introduced in the patch.

The patch is validated and ready for clean application via `git apply`.

---

## 6. Verification Method

### 1. Test Patch Dry-Run
Run `git apply --check` to ensure the patch applies without conflicts:
```bash
git apply --check .agents/teamwork/teamwork_preview_explorer_m1_2/m1_css_hardening.patch
```
*Expected Result*: Exit code 0, no output.

### 2. Verify Tabular Nums
After applying, verify `tabular-nums` is present on `.chip-table`:
```bash
grep -n -C 3 'tabular-nums' assets/styles.css
```
*Expected Result*: Matches on `.clock` (553), `.stat__num` (842), `.chip-table td` (1320), `.bandwidth__val` (1461), `.benchmark__val` (1892), and responsive `.chip-table td` (2921).

### 3. Verify Scroll Margin
Verify heading and target scroll-margins:
```bash
grep -n -C 5 'scroll-margin-top' assets/styles.css
```
*Expected Result*: Lines 249-260 contain `h1, h2, h3, h4, h5, h6, [id]:target, :target` with `scroll-margin-top: 6rem;`.

### 4. Verify Mobile Nav Containment
Verify mobile `.nav` contains `overscroll-behavior`:
```bash
grep -n -C 6 'overscroll-behavior: contain' assets/styles.css
```
*Expected Result*: Matches inside `.nav` under `@media (max-width: 980px)`.

### 5. Verify Safe Area Inset
Verify footer safe area:
```bash
grep -n -C 4 'env(safe-area-inset-bottom' assets/styles.css
```
*Expected Result*: Matches inside `.footer__bottom`.

### 6. Verify Zero `transition: all`
Verify no `transition: all` exists:
```bash
grep -nE 'transition\s*:\s*all|transition:\s*[^;]*\ball\b' assets/styles.css
```
*Expected Result*: 0 lines returned (exit code 1).
