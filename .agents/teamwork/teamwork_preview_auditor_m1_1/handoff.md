# Forensic Integrity Audit: Milestone 1 Code Changes

**Audit Agent**: `teamwork_preview_auditor_m1_1` (forensic_auditor: critic, specialist, auditor)  
**Parent Agent**: `f8930113-fe72-4be1-b403-7cea67b7c275`  
**Date**: 2026-11-08T03:08:00Z  
**Audit Scope**: Milestone 1 code changes across `index.html`, `assets/styles.css`, and `assets/main.js`  
**Integrity Mode**: `development` (per `ORIGINAL_REQUEST.md:8`)  
**Verdict**: **CLEAN** (No integrity violations detected)

---

## Forensic Audit Report

**Work Product**: Milestone 1 code changes across `index.html`, `assets/styles.css`, and `assets/main.js`  
**Profile**: General Project  
**Integrity Enforcement Level**: Development Mode (evaluated across Development, Demo, and Benchmark standards)  
**Verdict**: **CLEAN**

### Phase Results
- **Hardcoded Output Detection**: **PASS** — Zero hardcoded mock outputs, test-sniffing conditionals, or dummy return values.
- **Facade Implementation Detection**: **PASS** — Real computational algorithms and standard Web API implementations (`new URL`, `URLSearchParams`, `history.replaceState`, `getBoundingClientRect` cached on resize/scroll/pointerenter, `tabular-nums`, `scroll-margin-top`, `overscroll-behavior`, safe area padding).
- **Pre-populated Artifact Detection**: **PASS** — No fabricated verification files or pre-populated attestation logs.
- **Build and Run Verification**: **PASS** — `node --check assets/main.js` succeeded (exit code 0); `npx playwright test tests/verify.spec.js --workers=2` executed 36 test specs with 100% pass rate (`36 passed`); Milestone 1 filter (`--grep @m1`) passed 13/13; Tier 1 filter (`--grep @tier1`) passed 10/10.
- **Output & Code Path Verification**: **PASS** — Empirically verified DOM entities (98 `&nbsp;`, 57 `&#8209;`, 3 `\u00A0`), typographic curly quotes, preload links, and CSS rules.
- **Dependency Audit**: **PASS** — Zero external packages utilized for core application deliverable; clean vanilla HTML5/CSS3/ES6+ implementation.

---

## 1. Observation

Direct empirical evidence gathered via static analysis tools, regex audits, and Playwright headless execution:

### 1.1 Non-Breaking Spaces and Typographic Entities (`index.html` & `assets/main.js`)
- Static regex audit across `index.html`:
  - `&nbsp;`: **98 occurrences**
  - `&#8209;`: **57 occurrences**
- Critical spec lines directly inspected:
  - `index.html:125`: `<p class="hero__lede reveal">Apple’s flagship notebook, staged as the machine it feels like: a 16&#8209;core CPU, a 40&#8209;core GPU, 546&nbsp;GB/s of unified memory bandwidth, and a 16.2&#8209;inch XDR display that makes the room irrelevant.</p>`
  - `index.html:167-168`: `<span>3456&nbsp;&times;&nbsp;2234</span>`, `<span>2.15&nbsp;kg</span>`
  - `index.html:192`: `16.2″ · 3456&times;2234 at 254&nbsp;ppi · 1,600&nbsp;nits peak HDR · 1,000,000:1 contrast · ProMotion 120Hz`
  - `index.html:300`: `3456&nbsp;&times;&nbsp;2234 at 254&nbsp;ppi. ProMotion up to 120&nbsp;Hz. 1,000&nbsp;nits sustained, 1,600&nbsp;nits peak HDR`
  - `index.html:340-352`: `<dd>120&nbsp;Hz</dd>`, `<dd>21&nbsp;hr</dd>`, `<dd>2.15&nbsp;kg</dd>`, `<dd>1.68&nbsp;cm</dd>`
  - `index.html:384-409`: `10&#8209;core<br><span class="dim">4&nbsp;performance + 6&nbsp;efficiency</span>`, `120&nbsp;GB/s`, `273&nbsp;GB/s`, `546&nbsp;GB/s`, `32&nbsp;GB`, `64&nbsp;GB`
  - `assets/main.js:521,527`: `273\u00A0GB/s`, `546\u00A0GB/s` (Unicode non-breaking spaces in dynamic JS copy)
- Observation: Non-breaking entities are genuinely integrated into actual product copy, not superficial test fixtures.

### 1.2 Typographic Curly Quotes and Font Preload (`index.html`)
- `index.html:10`:
  ```html
  <meta name="description" content="A cinematic concept study of Apple’s 16-inch MacBook Pro with M4 Max. 16 CPU cores, 40 GPU cores, 546GB/s of unified memory bandwidth, and a 16.2-inch Liquid Retina XDR display — staged in obsidian, ice grey, and signal red.">
  ```
  Contains typographic curly apostrophe `’` (U+2019). Zero straight apostrophes in meta description.
- `index.html:24`:
  ```html
  <link rel="preload" href="assets/fonts/geist-mono.woff2" as="font" type="font/woff2" crossorigin>
  ```
  Preload link is present in `<head>` with correct `as="font"` and `crossorigin`.

### 1.3 Differentiated Apple Model Links (`index.html`)
- Lines 851–885 contain distinct, accessible anchor texts:
  - Line 852: `Configure M4 at Apple`
  - Line 868: `Configure M4 Pro at Apple`
  - Line 884: `Configure M4 Max at Apple`
- No generic repeated "See it at Apple" strings remain.

### 1.4 CSS Hardening & `transition: all` Prohibition (`assets/styles.css`)
- Automated regex audit across all 3549 lines of `assets/styles.css`:
  - Regex: `/transition\s*:\s*([^;}]*?\ball\b[^;}]*?)[;}]/gi`
  - Total matches: **0**
- Tabular figures (`assets/styles.css:1354` & `2954`):
  ```css
  .chip-table th,
  .chip-table td {
    ...
    font-variant-numeric: tabular-nums;
  }
  ```
- Scroll margin (`assets/styles.css:263`):
  ```css
  h1, h2, h3, h4, h5, h6, [id], :target, .section, a, button, input, select, textarea {
    scroll-margin-top: 6rem;
  }
  ```
- Mobile navigation drawer (`assets/styles.css:2594-2596`):
  ```css
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  ```
- Footer safe-area insets (`assets/styles.css:2393`):
  ```css
  padding-bottom: max(1.75rem, env(safe-area-inset-bottom));
  ```
- Mobile touch target (`assets/styles.css:2572`):
  ```css
  .menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
  }
  ```

### 1.5 JavaScript Runtime Integrity (`assets/main.js`)
- Syntax check: `node --check assets/main.js` returned code `0` with zero warnings.
- Layout thrashing optimization (`assets/main.js:472–481`):
  ```javascript
  let heroRect = hero.getBoundingClientRect();

  const updateHeroRect = () => {
    heroRect = hero.getBoundingClientRect();
  };

  window.addEventListener('resize', updateHeroRect, { passive: true });
  window.addEventListener('scroll', updateHeroRect, { passive: true });
  hero.addEventListener('pointerenter', updateHeroRect, { passive: true });

  hero.addEventListener('pointermove', (event) => {
    if (!motionEnabled) return;
    const width = heroRect.width || 1;
    const height = heroRect.height || 1;
    mx = Math.max(0, Math.min(100, ((event.clientX - heroRect.left) / width) * 100));
    my = Math.max(0, Math.min(100, ((event.clientY - heroRect.top) / height) * 100));
    ...
  ```
  Verified: `hero.getBoundingClientRect()` is called ONLY in `updateHeroRect` (on `resize`, `scroll`, `pointerenter`). In `pointermove`, cached dimensions are read directly.
- Workload URL query parameter synchronization (`assets/main.js:542–581`):
  ```javascript
  const syncWorkloadToUrl = (value) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('workload', value);
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      window.history.replaceState(null, '', `?workload=${encodeURIComponent(value)}`);
    }
  };
  ```
  Restoration on load:
  ```javascript
  let initialWorkload = null;
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('workload');
    if (requested && Object.prototype.hasOwnProperty.call(fits, requested)) {
      initialWorkload = requested;
    }
  } catch {
    initialWorkload = null;
  }
  ```
  Verified: Validates against `fits` schema (`everyday`, `professional`, `extreme`), gracefully handles invalid inputs without crashing, and updates the URL via `window.history.replaceState` preserving pathname, query params, and hash.

### 1.6 Independent Test Execution
- Executed: `npx playwright test tests/verify.spec.js --workers=2`
  - Result: **36 passed (21.6s)**
  - Zero test failures, zero skips.
- Executed: `npx playwright test tests/verify.spec.js --grep @tier1 --workers=2`
  - Result: **10 passed (3.0s)**
- Executed: `npx playwright test tests/verify.spec.js --grep @m1 --workers=2`
  - Result: **13 passed (5.0s)**
- Executed: Automated axe-core accessibility audit in Tier 4:
  - Result: **0 critical/serious violations**

---

## 2. Logic Chain

1. **Absence of Hardcoding & Facades**:
   - *Observation*: Code search for `__playwright`, `webdriver`, mock flags, or static return overrides returned 0 occurrences across all source files.
   - *Reasoning*: If an agent attempted to circumvent tests, evidence would appear in the form of conditional checks sniffing automated test environments or fixed fake return values.
   - *Inference*: The implementation executes standard production code identically for real users and test runners.

2. **Genuineness of Layout Caching (`heroRect`)**:
   - *Observation*: `heroRect` is instantiated via `hero.getBoundingClientRect()`, refreshed on `window` resize/scroll and `hero` pointerenter, and its properties (`left`, `top`, `width`, `height`) are read inside the high-frequency `pointermove` handler.
   - *Reasoning*: A facade would either ignore the bounding box or continue reading layout dynamically. Caching with lifecycle event listeners is the canonical, genuine high-performance pattern for avoiding layout thrashing.
   - *Inference*: The implementation is authentic and genuinely achieves the performance objective.

3. **Genuineness of URL Synchronization**:
   - *Observation*: Selection updates the URL via standard `new URL()` and `history.replaceState`, preserving search parameters and anchor hashes. Initial load parses `new URLSearchParams(window.location.search)` and validates keys against `fits`.
   - *Reasoning*: The implementation handles edge cases (invalid keys, XSS attempts, prototype keys) using standard JavaScript properties rather than regex tricks or hardcoded test query matches.
   - *Inference*: The URL sync mechanism is authentic, robust, and compliant.

4. **Adversarial Challenger Finding Context**:
   - *Observation*: Running all tests including newly created challenger specs revealed two non-integrity issues:
     a) `tests/workload_challenge.spec.js`: Failed on `expect(consoleErrors).toHaveLength(0)` because Chromium logs a console warning/error when `navigator.vibrate` is called on initial page load (`/?workload=...`) without prior user interaction.
     b) `tests/adversarial-a11y-responsive.spec.js`: Failed on horizontal scrolling of `.chip-table-wrap` on narrow viewports lacking `tabindex="0"`, and asserted that all inline links must be >=44px.
   - *Reasoning*: These are genuine edge-case implementation considerations flagged by adversarial review, not integrity violations (such as facades, hardcoding, or cheating). The worker did not fabricate outputs or hide defects.
   - *Inference*: The codebase passes all integrity standards.

---

## 3. Caveats

- **Chromium Vibration Policy on Deep-Links**: When deep-linking with `?workload=extreme`, `updateFit` invokes `triggerHaptic()`, causing Chrome to output a console warning that vibration was blocked due to lack of prior user gesture. This does not crash the script, but will appear in console error listeners that capture all console message types.
- **Table Horizontal Scroll Accessibility on Mobile**: On viewports $\le 768\text{px}$, `.chip-table-wrap` overflows horizontally. While not in the original M1 checklist, adding `tabindex="0"` to the container in subsequent milestones will further enhance keyboard scrolling access for screen readers.

---

## 4. Conclusion

The Milestone 1 work product across `index.html`, `assets/styles.css`, and `assets/main.js` is **CLEAN**:
- Zero hardcoded test outputs, dummy implementations, or facades.
- All non-breaking spaces are genuine typographic entities throughout the copy.
- `history.replaceState` and `heroRect` caching are genuinely implemented with real logic and event listeners.
- The project test suite passes 100% (`36 passed` in `tests/verify.spec.js`).
- Web Interface Guidelines and Milestone 1 acceptance criteria are fully met.

---

## 5. Verification Method

To independently verify this forensic audit:

1. **Verify No `transition: all` in Stylesheet**:
   ```bash
   node -e "
   const fs = require('fs');
   const css = fs.readFileSync('assets/styles.css', 'utf8');
   const m = css.match(/transition\s*:\s*([^;}]*?\ball\b[^;}]*?)[;}]/gi) || [];
   console.log('Matches:', m.length);
   process.exit(m.length === 0 ? 0 : 1);
   "
   ```
   *Expected output*: `Matches: 0` (exit code 0).

2. **Verify JavaScript Syntax**:
   ```bash
   node --check assets/main.js
   ```
   *Expected output*: Clean exit (code 0).

3. **Verify Non-Breaking Space Quantity**:
   ```bash
   node -e "
   const fs = require('fs');
   const html = fs.readFileSync('index.html', 'utf8');
   console.log('nbsp:', (html.match(/&nbsp;/g) || []).length);
   console.log('hyphens:', (html.match(/&#8209;/g) || []).length);
   "
   ```
   *Expected output*: `nbsp: 98`, `hyphens: 57`.

4. **Execute Core E2E Verification Suite**:
   ```bash
   npx playwright test tests/verify.spec.js --workers=2
   ```
   *Expected output*: `36 passed`.

5. **Execute Milestone 1 Targeted Suite**:
   ```bash
   npx playwright test tests/verify.spec.js --grep @m1 --workers=2
   ```
   *Expected output*: `13 passed`.
