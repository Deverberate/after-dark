# JS Hardening Exploration & Implementation Plan: `assets/main.js`

**Date**: 2026-11-07T20:18:00Z  
**Agent**: `teamwork_preview_explorer_m1_3`  
**Working Directory**: `/Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/.agents/teamwork/teamwork_preview_explorer_m1_3/`  
**Target Codebase File**: `/Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/assets/main.js`  
**Associated Artifacts**:
- `assets_main_js_m1.patch` (clean, verified git patch)
- `proposed_main.js` (complete modified source candidate)

---

## 1. Observation

Direct code examination of `assets/main.js` (802 lines) and `index.html` (829 lines) revealed three specific issues in JavaScript behavior requiring hardening under Milestone 1:

### 1.1 Layout Thrashing in Hero Pointerglow Handler
- **Location**: `assets/main.js:254-276`
- **Observed Code**:
  ```javascript
  254:   const hero = document.querySelector('.hero');
  255: 
  256:   if (hero && window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion()) {
  257:     let mx = 74;
  258:     let my = 24;
  259:     let queued = false;
  260: 
  261:     hero.addEventListener('pointermove', (event) => {
  262:       if (!motionEnabled) return;
  263: 
  264:       const rect = hero.getBoundingClientRect();
  265:       mx = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
  266:       my = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
  267: 
  268:       if (queued) return;
  269:       queued = true;
  270:       requestAnimationFrame(() => {
  271:         hero.style.setProperty('--mx', `${mx}%`);
  272:         hero.style.setProperty('--my', `${my}%`);
  273:         queued = false;
  274:       });
  275:     });
  276:   }
  ```
- **Defect**: Line 264 calls `hero.getBoundingClientRect()` synchronously inside the `pointermove` event listener. High-frequency pointer movement (60–120Hz) forces layout recalculation (forced synchronous reflow / layout thrashing) on every frame before RAF scheduling.

### 1.2 Missing Workload URL Query Parameter Synchronization
- **Location**: `assets/main.js:281-326`
- **Observed Code**:
  ```javascript
  281:   const workloadInputs = Array.from(
  282:     document.querySelectorAll('input[name="workload"]')
  283:   );
  284:   const fitName = document.getElementById('fit-name');
  285:   const fitModel = document.getElementById('fit-model');
  286:   const fitCopy = document.getElementById('fit-copy');
  ...
  309:   const updateFit = (value) => {
  310:     const fit = fits[value];
  311:     if (!fit) return;
  312:     if (fitName) fitName.textContent = fit.name;
  313:     if (fitModel) fitModel.textContent = fit.model;
  314:     if (fitCopy) fitCopy.textContent = fit.copy;
  315:   };
  316: 
  317:   if (workloadInputs.length) {
  318:     workloadInputs.forEach((input) => {
  319:       input.addEventListener('change', () => {
  320:         if (input.checked) updateFit(input.value);
  321:       });
  322:     });
  323: 
  324:     const checked = workloadInputs.find((input) => input.checked);
  325:     if (checked) updateFit(checked.value);
  326:   }
  ```
- **Associated HTML Markup (`index.html:402-423`)**:
  - Three radio inputs: `value="everyday"` (checked by default), `value="professional"`, `value="extreme"`.
- **Defect**:
  1. When a user selects a workload radio, the selection is applied locally to `#fit-name`, `#fit-model`, `#fit-copy`, but never reflected in the URL query string via `history.replaceState`.
  2. On page load, `window.location.search` is never parsed; deep-links such as `?workload=extreme` or `?workload=professional` are ignored, leaving the radio set to the static HTML default (`everyday`).

### 1.3 Missing Non-Breaking Spaces in JS-Generated Strings
- **Locations**:
  - `assets/main.js:299`:
    ```javascript
    299:         'Up to 14 CPU cores, up to 20 GPU cores, and 273GB/s of bandwidth give 4K multicam, large Xcode builds, 3D scenes, and local models room to breathe.',
    ```
    Observed: `273GB/s` lacks spacing completely.
  - `assets/main.js:305`:
    ```javascript
    305:         'Up to 16 CPU cores, up to 40 GPU cores, and 546GB/s of unified memory bandwidth. Built for 8K, simulation, model training, and every heavy app open at once.',
    ```
    Observed: `546GB/s` lacks spacing completely.
  - `assets/main.js:502`:
    ```javascript
    502:       label('UNIFIED MEMORY FABRIC · 546 GB/s', mem.x, mem.y - 8, 'rgba(230,237,241,0.48)', Math.max(8, width * 0.0058));
    ```
    Observed: `546 GB/s` uses standard ASCII breaking space (U+0020).
- **DOM Rendering Context**:
  - Line 314 assigns `fitCopy.textContent = fit.copy`. `Node.textContent` treats string content as plain text and does **not** evaluate HTML entities like `&nbsp;`. If `&nbsp;` is placed in `fit.copy`, the literal characters `&nbsp;` appear in the rendered document.
  - Line 362 renders canvas labels via `ctx.fillText(text, x, y)`. The HTML Canvas 2D Context also does **not** parse HTML entities.
  - Therefore, Unicode escape `\u00A0` (NO-BREAK SPACE) must be used in JavaScript string literals.

---

## 2. Logic Chain

1. **Elimination of Layout Thrashing**:
   - *Observation*: `assets/main.js:264` queries `hero.getBoundingClientRect()` inside the `pointermove` event handler.
   - *Premise*: `pointermove` events fire synchronously at the mouse polling rate (up to 120Hz). Invoking `getBoundingClientRect()` forces synchronous style resolution and reflow if any style dirtiness exists in the frame, causing frame drops.
   - *Inference*: Caching the bounding rectangle in a module variable `let heroRect = hero.getBoundingClientRect();` on initialization, updating it via `window.addEventListener('resize', updateHeroRect, { passive: true })`, `window.addEventListener('scroll', updateHeroRect, { passive: true })`, and `hero.addEventListener('pointerenter', updateHeroRect, { passive: true })`, allows `pointermove` to read cached properties (`heroRect.left`, `heroRect.top`, `heroRect.width`, `heroRect.height`) without a single forced reflow.
   - *Robustness Guard*: Adding `heroRect.width || 1` and `heroRect.height || 1` prevents division by zero (`NaN%`) before initial layout completes.

2. **Workload Selector URL State Synchronization**:
   - *Observation*: `assets/main.js:317-326` attaches change listeners to `workloadInputs`, but lacks query parameter reads or writes.
   - *Premise*: Web Interface Guidelines require stateful controls (filters, tabs, workloads) to be deep-linkable and synchronized with the browser location bar without causing page reload (`history.replaceState`).
   - *Inference*:
     - On user interaction (`input.addEventListener('change', ...)`), when `input.checked`, call `syncWorkloadToUrl(input.value)`.
     - Construct the new URL via `new URL(window.location.href)` and `url.searchParams.set('workload', value)` (or fallback `?workload=${encodeURIComponent(value)}`), preserving pathname and existing hash (`#silicon`).
     - On initial page load, parse `new URLSearchParams(window.location.search).get('workload')`. Validate that the value exists in `fits` (`Object.prototype.hasOwnProperty.call(fits, requested)`) to prevent injection or invalid state. If valid, check the matching radio button, uncheck peers, and call `updateFit(initialWorkload)`. If absent or invalid, preserve the default checked radio (`everyday`).

3. **Non-Breaking Space Preservation in JavaScript**:
   - *Observation*: `assets/main.js:299` has `273GB/s`, line 305 has `546GB/s`, and line 502 has `546 GB/s`.
   - *Premise*: R1 requires all numbers and units to be glued together with non-breaking spaces.
   - *Inference*:
     - In JavaScript strings assigned via `.textContent` or passed to `ctx.fillText()`, entity references like `&nbsp;` fail (displaying raw `&nbsp;` text).
     - The Unicode escape sequence `\u00A0` produces the exact NO-BREAK SPACE character (U+00A0, UTF-8 `0xC2 0xA0`).
     - Updating line 299 to `'... and 273\u00A0GB/s of bandwidth ...'`, line 305 to `'... and 546\u00A0GB/s of unified memory bandwidth ...'`, and line 502 to `'UNIFIED MEMORY FABRIC · 546\u00A0GB/s'` guarantees correct typography across all viewports.

---

## 3. Implementation Plan & Exact Code Patches

### Patch Component 1: Pointerglow Layout Cache
- **Target File**: `assets/main.js`
- **Target Lines**: 254–276

#### Before:
```javascript
  const hero = document.querySelector('.hero');

  if (hero && window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion()) {
    let mx = 74;
    let my = 24;
    let queued = false;

    hero.addEventListener('pointermove', (event) => {
      if (!motionEnabled) return;

      const rect = hero.getBoundingClientRect();
      mx = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
      my = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));

      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        hero.style.setProperty('--mx', `${mx}%`);
        hero.style.setProperty('--my', `${my}%`);
        queued = false;
      });
    });
  }
```

#### After:
```javascript
  const hero = document.querySelector('.hero');

  if (hero && window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion()) {
    let mx = 74;
    let my = 24;
    let queued = false;
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

      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        hero.style.setProperty('--mx', `${mx}%`);
        hero.style.setProperty('--my', `${my}%`);
        queued = false;
      });
    });
  }
```

---

### Patch Component 2: Workload Selector URL Sync & Non-Breaking Spaces in `fits`
- **Target File**: `assets/main.js`
- **Target Lines**: 296–326

#### Before:
```javascript
    professional: {
      name: 'M4 Pro',
      model: '14- or 16-inch MacBook Pro with M4 Pro',
      copy:
        'Up to 14 CPU cores, up to 20 GPU cores, and 273GB/s of bandwidth give 4K multicam, large Xcode builds, 3D scenes, and local models room to breathe.',
    },
    extreme: {
      name: 'M4 Max',
      model: '16-inch MacBook Pro with M4 Max',
      copy:
        'Up to 16 CPU cores, up to 40 GPU cores, and 546GB/s of unified memory bandwidth. Built for 8K, simulation, model training, and every heavy app open at once.',
    },
  };

  const updateFit = (value) => {
    const fit = fits[value];
    if (!fit) return;
    if (fitName) fitName.textContent = fit.name;
    if (fitModel) fitModel.textContent = fit.model;
    if (fitCopy) fitCopy.textContent = fit.copy;
  };

  if (workloadInputs.length) {
    workloadInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) updateFit(input.value);
      });
    });

    const checked = workloadInputs.find((input) => input.checked);
    if (checked) updateFit(checked.value);
  }
```

#### After:
```javascript
    professional: {
      name: 'M4 Pro',
      model: '14- or 16-inch MacBook Pro with M4 Pro',
      copy:
        'Up to 14 CPU cores, up to 20 GPU cores, and 273\u00A0GB/s of bandwidth give 4K multicam, large Xcode builds, 3D scenes, and local models room to breathe.',
    },
    extreme: {
      name: 'M4 Max',
      model: '16-inch MacBook Pro with M4 Max',
      copy:
        'Up to 16 CPU cores, up to 40 GPU cores, and 546\u00A0GB/s of unified memory bandwidth. Built for 8K, simulation, model training, and every heavy app open at once.',
    },
  };

  const updateFit = (value) => {
    const fit = fits[value];
    if (!fit) return;
    if (fitName) fitName.textContent = fit.name;
    if (fitModel) fitModel.textContent = fit.model;
    if (fitCopy) fitCopy.textContent = fit.copy;
  };

  const syncWorkloadToUrl = (value) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('workload', value);
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      window.history.replaceState(null, '', `?workload=${encodeURIComponent(value)}`);
    }
  };

  if (workloadInputs.length) {
    workloadInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) {
          updateFit(input.value);
          syncWorkloadToUrl(input.value);
        }
      });
    });

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

    if (initialWorkload) {
      const targetInput = workloadInputs.find((input) => input.value === initialWorkload);
      if (targetInput) {
        workloadInputs.forEach((input) => {
          input.checked = input === targetInput;
        });
        updateFit(initialWorkload);
      }
    } else {
      const checked = workloadInputs.find((input) => input.checked);
      if (checked) updateFit(checked.value);
    }
  }
```

---

### Patch Component 3: Canvas Die-Map Memory Bandwidth Label
- **Target File**: `assets/main.js`
- **Target Line**: 502 (shifted to line 546 after above additions)

#### Before:
```javascript
      label('UNIFIED MEMORY FABRIC · 546 GB/s', mem.x, mem.y - 8, 'rgba(230,237,241,0.48)', Math.max(8, width * 0.0058));
```

#### After:
```javascript
      label('UNIFIED MEMORY FABRIC · 546\u00A0GB/s', mem.x, mem.y - 8, 'rgba(230,237,241,0.48)', Math.max(8, width * 0.0058));
```

---

## 4. Caveats

1. **Read-Only Explorer Mandate**: In strict compliance with the Teamwork Explorer archetype, `assets/main.js` in the project root remains **unmodified** by this agent. The complete patched file has been created as `.agents/teamwork/teamwork_preview_explorer_m1_3/proposed_main.js`, and the diff has been saved as `.agents/teamwork/teamwork_preview_explorer_m1_3/assets_main_js_m1.patch`.
2. **URL Construction in Restricted Contexts**: In rare browser environments (such as sandboxed iframes or `file:///` URLs with restricted origins), calling `history.replaceState` can throw a SecurityError. The implementation wraps the URL update in a `try...catch` block so that inability to rewrite the URL never breaks the DOM radio functionality.
3. **Downstream Milestone Integration (M4 Telemetry Tray & M5 Audio)**: The workload selector implementation preserves the standard `'change'` event dispatch on `workloadInputs`. Milestone 4 (telemetry tray) and Milestone 5 (audio tactical lock sound) can attach standard event listeners to `workloadInputs` without encountering monkey-patched conflicts.

---

## 5. Conclusion

The JS hardening plan for `assets/main.js` is fully specified, verified, and ready for immediate implementation by the Milestone 1 implementation agent:
1. **Layout thrashing eliminated**: `getBoundingClientRect()` is moved out of the `pointermove` loop and cached on initialization, `resize`, `scroll`, and `pointerenter` with `{ passive: true }`.
2. **Workload URL synchronization complete**: `syncWorkloadToUrl` uses `history.replaceState` with `URLSearchParams`, preserving URL path and hash; initial load validates against whitelist `['everyday', 'professional', 'extreme']`, checks the radio input, and updates `#fit-name`, `#fit-model`, and `#fit-copy`.
3. **Non-breaking spaces preserved**: Unicode `\u00A0` replaces missing spaces and breaking spaces in `assets/main.js:299`, `305`, and `502`, preventing HTML entity leakage in `textContent` and Canvas `fillText`.
4. **Zero-defect patch validation**: The generated `.patch` passes `git apply --check` cleanly, and `proposed_main.js` passes `node --check` with exit code 0.

---

## 6. Verification Method

An implementer or testing agent can verify the patch independently using the following methods:

### Step 1: Verify Patch Applicability
Run a dry run of git apply from the project root:
```bash
git apply --check .agents/teamwork/teamwork_preview_explorer_m1_3/assets_main_js_m1.patch
```
*Expected Result*: Exits with code 0 and no stderr.

### Step 2: Apply the Patch
To apply the changes to `assets/main.js`:
```bash
git apply .agents/teamwork/teamwork_preview_explorer_m1_3/assets_main_js_m1.patch
```
Or copy `proposed_main.js`:
```bash
cp .agents/teamwork/teamwork_preview_explorer_m1_3/proposed_main.js assets/main.js
```

### Step 3: Syntax Verification
Verify JavaScript syntax after applying:
```bash
node --check assets/main.js
```
*Expected Result*: Exits with code 0.

### Step 4: Verify Non-Breaking Space Characters
Verify that `\u00A0` is present and that no unescaped `&nbsp;` exists in JavaScript strings:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('assets/main.js', 'utf8');
const lines = src.split('\n');
console.log('Line 299 check:', /273(\\\\u00A0|\u00A0)GB\/s/.test(src));
console.log('Line 305 check:', /546(\\\\u00A0|\u00A0)GB\/s/.test(src));
console.log('Line 502 check:', /FABRIC · 546(\\\\u00A0|\u00A0)GB\/s/.test(src));
console.log('No literal &nbsp; in JS:', !src.includes('&nbsp;'));
"
```
*Expected Output*:
```
Line 299 check: true
Line 305 check: true
Line 502 check: true
No literal &nbsp; in JS: true
```

### Step 5: Functional Verification via Playwright (or Browser Automation)
Execute in a browser / Playwright test:
```javascript
// 1. Verify URL param on radio change
await page.goto('http://127.0.0.1:3000');
await page.locator('input[name="workload"][value="extreme"]').check();
expect(page.url()).toContain('?workload=extreme');
expect(await page.locator('#fit-name').textContent()).toBe('M4 Max');

// 2. Verify deep linking on load
await page.goto('http://127.0.0.1:3000/?workload=professional');
expect(await page.locator('input[name="workload"][value="professional"]').isChecked()).toBe(true);
expect(await page.locator('#fit-name').textContent()).toBe('M4 Pro');

// 3. Verify fallback for unknown query param
await page.goto('http://127.0.0.1:3000/?workload=quantum');
expect(await page.locator('input[name="workload"][value="everyday"]').isChecked()).toBe(true);
expect(await page.locator('#fit-name').textContent()).toBe('M4');

// 4. Verify no getBoundingClientRect in pointermove
const calls = await page.evaluate(() => {
  let count = 0;
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function() {
    count++;
    return original.apply(this, arguments);
  };
  const hero = document.querySelector('.hero');
  hero.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 200 }));
  hero.dispatchEvent(new PointerEvent('pointermove', { clientX: 250, clientY: 250 }));
  return count;
});
expect(calls).toBe(0);
```
