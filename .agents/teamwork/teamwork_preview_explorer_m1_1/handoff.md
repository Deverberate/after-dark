# Milestone 1: HTML Hardening Patch Plan Report

**Date**: 2026-11-07T20:16:00Z  
**Agent**: `teamwork_preview_explorer_m1_1` (Explorer Archetype)  
**Target File**: `/Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/index.html`  
**Working Directory**: `/Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/.agents/teamwork/teamwork_preview_explorer_m1_1/`  
**Companion Artifact**: `index.html.patch` (validated unified diff in working directory)  

---

## 1. Observation

Direct observations from inspecting `index.html` (828 lines), `PROJECT.md`, `ORIGINAL_REQUEST.md`, and Survey 2 `handoff.md`:

### Target 1: Straight Apostrophe in Line 10 Meta Description
- **Location**: `index.html:10`
- **Observed Verbatim Line**:
  ```html
  <meta name="description" content="A cinematic concept study of Apple's 16-inch MacBook Pro with M4 Max. 16 CPU cores, 40 GPU cores, 546GB/s of unified memory bandwidth, and a 16.2-inch Liquid Retina XDR display — staged in obsidian, ice grey, and signal red.">
  ```
- **Defect**: Straight apostrophe ASCII `'` (U+0027) in `Apple's`. All other body text across the page (e.g., lines 121, 476, 483, 696, 812) uses typographic curly apostrophe `’` (U+2019).
- **Target Replacement**: `Apple’s`

---

### Target 2: Font Preload for Geist Mono in `<head>`
- **Location**: `index.html:22-24`
- **Observed Verbatim Block**:
  ```html
  <link rel="preload" href="assets/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/instrument-serif-italic.woff2" as="font" type="font/woff2" crossorigin>

  <link rel="stylesheet" href="assets/styles.css">
  ```
- **Defect**: `assets/fonts/geist-mono.woff2` is physically present on disk and referenced in `@font-face` (`assets/styles.css:26-33`), but is missing a `<link rel="preload">` in `<head>`.
- **Target Insertion** (immediately following line 23):
  ```html
  <link rel="preload" href="assets/fonts/geist-mono.woff2" as="font" type="font/woff2" crossorigin>
  ```

---

### Target 3: Model Card CTA Link Label Specificity
- **Location**: `index.html:723-757`
- **Observed Verbatim Lines**:
  - Line 724 (M4 14-inch card):
    ```html
    See it at Apple <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr-only"> (opens in a new tab)</span>
    ```
  - Line 740 (M4 Pro card):
    ```html
    See it at Apple <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr-only"> (opens in a new tab)</span>
    ```
  - Line 756 (M4 Max card):
    ```html
    See it at Apple <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr-only"> (opens in a new tab)</span>
    ```
- **Defect**: Three identical generic link labels violate Web Interface Guidelines ("Specific button labels: 'Save API Key' not 'Continue'").
- **Target Replacements**:
  - Line 724: `Configure M4 at Apple`
  - Line 740: `Configure M4 Pro at Apple`
  - Line 756: `Configure M4 Max at Apple`

---

### Target 4: Numerals and Units Lacking Non-Breaking Spaces (`&nbsp;` / `&#8209;`)
Inspected all DOM text nodes across `index.html`. Identified **83 lines** containing **115+ specific unit and numeral instances** spanning all 17 categories cataloged in Survey 2:
1. **Weight (`kg`)**: Lines 164, 283, 549, 684.
2. **Memory Bandwidth (`GB/s`)**: Lines 121, 145, 184, 192, 337, 338, 339, 454, 462, 720, 736, 752.
3. **Interface Bandwidth (`Gb/s`)**: Lines 249, 664.
4. **Dimensions (`cm`, `mm`)**: Lines 287, 550, 598, 664, 684.
5. **Memory & Storage Capacity (`GB`, `TB`)**: Lines 343, 344, 345, 648, 652, 692, 721, 737, 753.
6. **Core Counts (`-core`, `cores`)**: Lines 121, 137, 141, 182, 183, 190, 191, 319, 320, 321, 325, 326, 327, 331, 332, 333, 459, 461, 483, 538, 599, 640, 692, 718, 719, 734, 735, 750, 751.
7. **Refresh Rate (`Hz`)**: Lines 235, 275, 644.
8. **Luminance (`nits`)**: Lines 235, 608, 644.
9. **Battery & Runtime (`hr`, `hours`)**: Lines 149, 242, 279, 656.
10. **Power & Energy (`W`, `Wh`)**: Lines 599, 656, 660.
11. **Optics & Resolution (`MP`, `ppi`)**: Lines 235, 256, 609, 644, 668.
12. **Screen Size (`inch`)**: Lines 114, 121, 173, 208, 228, 235, 242, 349, 350, 351, 429, 625, 636, 644, 714, 730, 746, 803, 804.
13. **Mathematical Multiplier & Aspect (`×` / `&times;`)**: Lines 163, 235, 394, 476, 481, 493, 501, 509, 517, 525, 533, 644, 684.

---

## 2. Logic Chain

1. **Typographic Integrity (Apostrophe)**:
   - *Observation*: Line 10 contains `Apple's` while line 121, 476, 483, 696, 812 contain `Apple’s`.
   - *Logic*: Mixing straight and curly quotes within the same document creates typographical inconsistency. Replacing `'` with `’` in `<meta name="description">` brings metadata in parity with page typography.
2. **Web Font Preloading & Cumulative Layout Shift / FOIT**:
   - *Observation*: `instrument-sans.woff2` and `instrument-serif-italic.woff2` are preloaded in lines 22-23. `geist-mono.woff2` is declared in CSS line 26 but not preloaded.
   - *Logic*: Monospace type is used immediately in the HUD elements, kicker labels, and spec tables. Preloading `geist-mono.woff2` prevents Flash of Invisible Text (FOIT) and layout shifts during initial render.
3. **Accessibility & Link Purpose (WCAG 2.4.4 & Web Interface Guidelines)**:
   - *Observation*: Three model cards (lines 724, 740, 756) have identical text "See it at Apple".
   - *Logic*: Screen reader users navigating by link list encounter three ambiguous "See it at Apple" destinations. Modifying the labels to "Configure M4 at Apple", "Configure M4 Pro at Apple", and "Configure M4 Max at Apple" provides unique accessible names that immediately convey context and target configuration.
4. **Typographical Non-Breaking Spacing (`&nbsp;` & `&#8209;`)**:
   - *Observation*: 83 lines separate numbers from units with standard whitespace or breakable hyphens (`2.15 kg`, `546 GB/s`, `16-core`, `1.68 cm`).
   - *Logic*: On mobile and responsive layouts, words wrap at line ends. Breaking a numeral from its unit (e.g., displaying `2.15` at the end of a line and `kg` at the beginning of the next line) degrades readability and violates Web Interface Guidelines.
   - *Implementation Rule*:
     - Use `&nbsp;` between numbers and unit symbols (`2.15&nbsp;kg`, `546&nbsp;GB/s`, `120&nbsp;Gb/s`, `1.68&nbsp;cm`, `3.5&nbsp;mm`, `32&nbsp;GB`, `1&nbsp;TB`, `120&nbsp;Hz`, `1,600&nbsp;nits`, `21&nbsp;hours`, `140&nbsp;W`, `100&nbsp;Wh`, `12&nbsp;MP`, `254&nbsp;ppi`, `&times;&nbsp;`).
     - For compound hyphenated adjectives (`16-core`, `16-inch`, `14-inch`, `16.2-inch`), standard hyphens `-` are breakable characters in browser text layout engines. Using the HTML non-breaking hyphen entity `&#8209;` (Unicode U+2011) preserves grammatical compound naming while guaranteeing zero line wrapping between numeral and word (`16&#8209;core`, `16&#8209;inch`).

---

## 3. Caveats

1. **Read-Only Explorer Scope**: In adherence to the Explorer archetype, this agent did not modify `index.html` directly. An exact, validated unified diff has been written to `index.html.patch` in this working directory for the implementation agent.
2. **Compound Terms vs Spaced Units**: Compound modifiers such as `16-core CPU` and `16-inch MacBook Pro` represent hyphenated compound adjectives, whereas `2.15 kg` and `546 GB/s` are number-unit phrases. We utilize `&#8209;` for hyphenated compounds and `&nbsp;` for number-unit pairs, providing optimal typographic rigor without altering semantic phrasing.
3. **Meta Tags Attributes**: `&nbsp;` HTML entities are applied to visible HTML text nodes (`<p>`, `<td>`, `<dd>`, `<span>`, `<li>`, `<h2>`, `<h3>`), while metadata content attributes (`<meta name="description">`) receive clean typographic Unicode characters (curly `’`) rather than HTML entities.

---

## 4. Conclusion & Complete Patch Plan

The exact before-and-after line replacements for `index.html` are presented below, organized sequentially by line number.

### Section A: `<head>` Metadata & Font Preloads (Lines 10–24)

#### Line 10: Meta Description Apostrophe
- **Before (Line 10)**:
  ```html
  <meta name="description" content="A cinematic concept study of Apple's 16-inch MacBook Pro with M4 Max. 16 CPU cores, 40 GPU cores, 546GB/s of unified memory bandwidth, and a 16.2-inch Liquid Retina XDR display — staged in obsidian, ice grey, and signal red.">
  ```
- **After (Line 10)**:
  ```html
  <meta name="description" content="A cinematic concept study of Apple’s 16-inch MacBook Pro with M4 Max. 16 CPU cores, 40 GPU cores, 546GB/s of unified memory bandwidth, and a 16.2-inch Liquid Retina XDR display — staged in obsidian, ice grey, and signal red.">
  ```

#### Line 23: Insert Geist Mono Preload
- **Before (Lines 22–24)**:
  ```html
  <link rel="preload" href="assets/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/instrument-serif-italic.woff2" as="font" type="font/woff2" crossorigin>

  <link rel="stylesheet" href="assets/styles.css">
  ```
- **After (Lines 22–25)**:
  ```html
  <link rel="preload" href="assets/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/instrument-serif-italic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/geist-mono.woff2" as="font" type="font/woff2" crossorigin>

  <link rel="stylesheet" href="assets/styles.css">
  ```

---

### Section B: Hero & Machine Sections (Lines 114–287)

#### Line 114: Hero Kicker
- **Before**:
  ```html
  <p class="hero__kicker reveal">MacBook Pro 16-inch <span aria-hidden="true">/</span> M4 Max</p>
  ```
- **After**:
  ```html
  <p class="hero__kicker reveal">MacBook Pro 16&#8209;inch <span aria-hidden="true">/</span> M4 Max</p>
  ```

#### Line 121: Hero Lede
- **Before**:
  ```html
  <p class="hero__lede reveal">Apple’s flagship notebook, staged as the machine it feels like: a 16-core CPU, a 40-core GPU, 546GB/s of unified memory bandwidth, and a 16.2-inch XDR display that makes the room irrelevant.</p>
  ```
- **After**:
  ```html
  <p class="hero__lede reveal">Apple’s flagship notebook, staged as the machine it feels like: a 16&#8209;core CPU, a 40&#8209;core GPU, 546&nbsp;GB/s of unified memory bandwidth, and a 16.2&#8209;inch XDR display that makes the room irrelevant.</p>
  ```

#### Lines 137, 141, 145, 149: Hero Stat DL Nodes
- **Before (Line 137)**: `<dd>16<span> cores</span></dd>`
- **After (Line 137)**: `<dd>16<span>&nbsp;cores</span></dd>`
- **Before (Line 141)**: `<dd>40<span> cores</span></dd>`
- **After (Line 141)**: `<dd>40<span>&nbsp;cores</span></dd>`
- **Before (Line 145)**: `<dd>546<span> GB/s</span></dd>`
- **After (Line 145)**: `<dd>546<span>&nbsp;GB/s</span></dd>`
- **Before (Line 149)**: `<dd>21<span> hr</span></dd>`
- **After (Line 149)**: `<dd>21<span>&nbsp;hr</span></dd>`

#### Lines 163, 164: Hero Image HUD Overlays
- **Before (Line 163)**:
  ```html
  <div class="hud hud--bl" aria-hidden="true"><span>16.2″ XDR</span><span>3456 × 2234</span></div>
  ```
- **After (Line 163)**:
  ```html
  <div class="hud hud--bl" aria-hidden="true"><span>16.2″ XDR</span><span>3456&nbsp;&times;&nbsp;2234</span></div>
  ```
- **Before (Line 164)**:
  ```html
  <div class="hud hud--br" aria-hidden="true"><span>Space Black</span><span>2.15 kg</span></div>
  ```
- **After (Line 164)**:
  ```html
  <div class="hud hud--br" aria-hidden="true"><span>Space Black</span><span>2.15&nbsp;kg</span></div>
  ```

#### Line 173: Hero Caption
- **Before**: `<span>M4 Max / 16-inch</span>`
- **After**: `<span>M4 Max / 16&#8209;inch</span>`

#### Lines 182–184 & 190–192: Ticker List Items
- **Before (Line 182)**: `<li>16-core CPU</li>`
- **After (Line 182)**: `<li>16&#8209;core CPU</li>`
- **Before (Line 183)**: `<li>40-core GPU</li>`
- **After (Line 183)**: `<li>40&#8209;core GPU</li>`
- **Before (Line 184)**: `<li>546GB/s unified memory</li>`
- **After (Line 184)**: `<li>546&nbsp;GB/s unified memory</li>`
- **Before (Line 190)**: `<li>16-core CPU</li>`
- **After (Line 190)**: `<li>16&#8209;core CPU</li>`
- **Before (Line 191)**: `<li>40-core GPU</li>`
- **After (Line 191)**: `<li>40&#8209;core GPU</li>`
- **Before (Line 192)**: `<li>546GB/s unified memory</li>`
- **After (Line 192)**: `<li>546&nbsp;GB/s unified memory</li>`

#### Line 208: Section Note
- **Before**: `<p class="section__note">MacBook Pro 16-inch. M4 Max. The top of the line, in the only finish that makes sense here.</p>`
- **After**: `<p class="section__note">MacBook Pro 16&#8209;inch. M4 Max. The top of the line, in the only finish that makes sense here.</p>`

#### Line 228: Machine Lede
- **Before**: `<p class="machine__lede reveal">The 16-inch M4 Max is not a cautious upgrade. It is a desktop-class machine that happens to fold: twelve performance cores, four efficiency cores, up to forty GPU cores, and a memory subsystem wide enough to keep all of them fed.</p>`
- **After**: `<p class="machine__lede reveal">The 16&#8209;inch M4 Max is not a cautious upgrade. It is a desktop-class machine that happens to fold: twelve performance cores, four efficiency cores, up to forty GPU cores, and a memory subsystem wide enough to keep all of them fed.</p>`

#### Line 235: Display Card Spec
- **Before**:
  ```html
  <p>16.2-inch Liquid Retina XDR. 3456 × 2234 at 254 ppi. ProMotion up to 120Hz. 1,000 nits sustained, 1,600 nits peak HDR, and an optional nano-texture finish that turns hard light into matte grey.</p>
  ```
- **After**:
  ```html
  <p>16.2&#8209;inch Liquid Retina XDR. 3456&nbsp;&times;&nbsp;2234 at 254&nbsp;ppi. ProMotion up to 120&nbsp;Hz. 1,000&nbsp;nits sustained, 1,600&nbsp;nits peak HDR, and an optional nano-texture finish that turns hard light into matte grey.</p>
  ```

#### Line 242: Battery Card Spec
- **Before**:
  ```html
  <p>Up to 21 hours of video playback on the 16-inch M4 Max. Enough to finish the cut, the build, or the render without hunting for a wall socket.</p>
  ```
- **After**:
  ```html
  <p>Up to 21&nbsp;hours of video playback on the 16&#8209;inch M4 Max. Enough to finish the cut, the build, or the render without hunting for a wall socket.</p>
  ```

#### Line 249: Ports Card Spec
- **Before**:
  ```html
  <p>Three Thunderbolt 5 ports at up to 120Gb/s, HDMI, an SDXC slot, MagSafe 3, and a headphone jack. The adapter dongle stays in the drawer.</p>
  ```
- **After**:
  ```html
  <p>Three Thunderbolt 5 ports at up to 120&nbsp;Gb/s, HDMI, an SDXC slot, MagSafe 3, and a headphone jack. The adapter dongle stays in the drawer.</p>
  ```

#### Line 256: Camera Card Spec
- **Before**:
  ```html
  <p>A 12MP Center Stage camera with Desk View, a six-speaker system with force-cancelling woofers, Spatial Audio, and a three-mic array. The call is the only thing that breaks the illusion.</p>
  ```
- **After**:
  ```html
  <p>A 12&nbsp;MP Center Stage camera with Desk View, a six-speaker system with force-cancelling woofers, Spatial Audio, and a three-mic array. The call is the only thing that breaks the illusion.</p>
  ```

#### Lines 275, 279, 283, 287: Machine Overview Specs DL
- **Before (Line 275)**: `<dd>120Hz</dd>`
- **After (Line 275)**: `<dd>120&nbsp;Hz</dd>`
- **Before (Line 279)**: `<dd>21 hr</dd>`
- **After (Line 279)**: `<dd>21&nbsp;hr</dd>`
- **Before (Line 283)**: `<dd>2.15 kg</dd>`
- **After (Line 283)**: `<dd>2.15&nbsp;kg</dd>`
- **Before (Line 287)**: `<dd>1.68 cm</dd>`
- **After (Line 287)**: `<dd>1.68&nbsp;cm</dd>`

---

### Section C: Silicon Comparison Table & Workload (Lines 319–462)

#### Lines 319–321: CPU Cores Table Row
- **Before (Line 319)**:
  ```html
  <td>10-core<br><span class="dim">4 performance + 6 efficiency</span></td>
  ```
- **After (Line 319)**:
  ```html
  <td>10&#8209;core<br><span class="dim">4&nbsp;performance + 6&nbsp;efficiency</span></td>
  ```
- **Before (Line 320)**:
  ```html
  <td>Up to 14-core<br><span class="dim">10 performance + 4 efficiency</span></td>
  ```
- **After (Line 320)**:
  ```html
  <td>Up to 14&#8209;core<br><span class="dim">10&nbsp;performance + 4&nbsp;efficiency</span></td>
  ```
- **Before (Line 321)**:
  ```html
  <td class="is-max">Up to 16-core<br><span class="dim">12 performance + 4 efficiency</span></td>
  ```
- **After (Line 321)**:
  ```html
  <td class="is-max">Up to 16&#8209;core<br><span class="dim">12&nbsp;performance + 4&nbsp;efficiency</span></td>
  ```

#### Lines 325–327: GPU Cores Table Row
- **Before (Line 325)**: `<td>10-core</td>`
- **After (Line 325)**: `<td>10&#8209;core</td>`
- **Before (Line 326)**: `<td>Up to 20-core</td>`
- **After (Line 326)**: `<td>Up to 20&#8209;core</td>`
- **Before (Line 327)**: `<td class="is-max">Up to 40-core</td>`
- **After (Line 327)**: `<td class="is-max">Up to 40&#8209;core</td>`

#### Lines 331–333: Neural Engine Cores Table Row
- **Before (Line 331)**: `<td>16-core</td>`
- **After (Line 331)**: `<td>16&#8209;core</td>`
- **Before (Line 332)**: `<td>16-core</td>`
- **After (Line 332)**: `<td>16&#8209;core</td>`
- **Before (Line 333)**: `<td class="is-max">16-core</td>`
- **After (Line 333)**: `<td class="is-max">16&#8209;core</td>`

#### Lines 337–339: Memory Bandwidth Table Row
- **Before (Line 337)**: `<td>120 GB/s</td>`
- **After (Line 337)**: `<td>120&nbsp;GB/s</td>`
- **Before (Line 338)**: `<td>273 GB/s</td>`
- **After (Line 338)**: `<td>273&nbsp;GB/s</td>`
- **Before (Line 339)**: `<td class="is-max">546 GB/s</td>`
- **After (Line 339)**: `<td class="is-max">546&nbsp;GB/s</td>`

#### Lines 343–345: Max Unified Memory Table Row
- **Before (Line 343)**: `<td>32GB</td>`
- **After (Line 343)**: `<td>32&nbsp;GB</td>`
- **Before (Line 344)**: `<td>64GB</td>`
- **After (Line 344)**: `<td>64&nbsp;GB</td>`
- **Before (Line 345)**: `<td class="is-max">128GB</td>`
- **After (Line 345)**: `<td class="is-max">128&nbsp;GB</td>`

#### Lines 349–351: Available Enclosures Table Row
- **Before (Line 349)**: `<td>14-inch</td>`
- **After (Line 349)**: `<td>14&#8209;inch</td>`
- **Before (Line 350)**: `<td>14- or 16-inch</td>`
- **After (Line 350)**: `<td>14-&nbsp;or&nbsp;16&#8209;inch</td>`
- **Before (Line 351)**: `<td class="is-max">14- or 16-inch</td>`
- **After (Line 351)**: `<td class="is-max">14-&nbsp;or&nbsp;16&#8209;inch</td>`

#### Line 394: Bandwidth Note
- **Before**: `<p class="bandwidth__foot">The Max moves 4.55× the data of the base M4 per second.</p>`
- **After**: `<p class="bandwidth__foot">The Max moves 4.55&times;&nbsp;the data of the base M4 per second.</p>`

#### Line 429: Workload Fit Model
- **Before**: `<p class="workload__model" id="fit-model">14-inch MacBook Pro with M4</p>`
- **After**: `<p class="workload__model" id="fit-model">14&#8209;inch MacBook Pro with M4</p>`

#### Lines 454, 459, 461, 462: Die Map Legend & Stats
- **Before (Line 454)**: `<span>546 GB/s</span>`
- **After (Line 454)**: `<span>546&nbsp;GB/s</span>`
- **Before (Line 459)**:
  ```html
  <div><dt><span class="legend-dot legend-dot--cpu" aria-hidden="true"></span>CPU clusters</dt><dd>12 performance + 4 efficiency cores</dd></div>
  ```
- **After (Line 459)**:
  ```html
  <div><dt><span class="legend-dot legend-dot--cpu" aria-hidden="true"></span>CPU clusters</dt><dd>12&nbsp;performance + 4&nbsp;efficiency cores</dd></div>
  ```
- **Before (Line 461)**:
  ```html
  <div><dt><span class="legend-dot legend-dot--ne" aria-hidden="true"></span>Neural Engine</dt><dd>16 cores for on-device AI</dd></div>
  ```
- **After (Line 461)**:
  ```html
  <div><dt><span class="legend-dot legend-dot--ne" aria-hidden="true"></span>Neural Engine</dt><dd>16&nbsp;cores for on-device AI</dd></div>
  ```
- **Before (Line 462)**:
  ```html
  <div><dt><span class="legend-dot legend-dot--mem" aria-hidden="true"></span>Memory bus</dt><dd>546GB/s unified bandwidth</dd></div>
  ```
- **After (Line 462)**:
  ```html
  <div><dt><span class="legend-dot legend-dot--mem" aria-hidden="true"></span>Memory bus</dt><dd>546&nbsp;GB/s unified bandwidth</dd></div>
  ```

---

### Section D: Proof & Armor Sections (Lines 476–609)

#### Line 476: Proof Note
- **Before**: `<p class="section__note">Apple’s own numbers: M4 Max against the M1 Max it replaces at the top of the line. Up to 3.5× the render, 2.2× the build.</p>`
- **After**: `<p class="section__note">Apple’s own numbers: M4 Max against the M1 Max it replaces at the top of the line. Up to 3.5&times;&nbsp;the render, 2.2&times;&nbsp;the build.</p>`

#### Line 481: Proof Stat Multiplier
- **Before**: `<p class="proof__stat">3.5<span>×</span></p>`
- **After**: `<p class="proof__stat">3.5<span>&times;</span></p>`

#### Line 483: Proof Stat Copy
- **Before**: `<p class="proof__stat-copy">Apple’s published comparison for the 16-core CPU / 40-core GPU M4 Max against a 10-core CPU / 32-core GPU M1 Max. The gap is the point.</p>`
- **After**: `<p class="proof__stat-copy">Apple’s published comparison for the 16&#8209;core CPU / 40&#8209;core GPU M4 Max against a 10&#8209;core CPU / 32&#8209;core GPU M1 Max. The gap is the point.</p>`

#### Lines 493, 501, 509, 517, 525, 533: Benchmark Ratio Tags
- **Before (Line 493)**: `<span class="bench__ratio">3.5×</span>`
- **After (Line 493)**: `<span class="bench__ratio">3.5&times;</span>`
- **Before (Line 501)**: `<span class="bench__ratio">3×+</span>`
- **After (Line 501)**: `<span class="bench__ratio">3&times;+</span>`
- **Before (Line 509)**: `<span class="bench__ratio">2.2×</span>`
- **After (Line 509)**: `<span class="bench__ratio">2.2&times;</span>`
- **Before (Line 517)**: `<span class="bench__ratio">2.2×</span>`
- **After (Line 517)**: `<span class="bench__ratio">2.2&times;</span>`
- **Before (Line 525)**: `<span class="bench__ratio">1.9×</span>`
- **After (Line 525)**: `<span class="bench__ratio">1.9&times;</span>`
- **Before (Line 533)**: `<span class="bench__ratio">1.6×</span>`
- **After (Line 533)**: `<span class="bench__ratio">1.6&times;</span>`

#### Line 538: Fineprint Note
- **Before**: `<p class="fineprint reveal">Apple-published “up to” comparisons, not independent lab tests. M4 Max configuration: 16-core CPU, 40-core GPU. M1 Max configuration: 10-core CPU, 32-core GPU. Real-world performance depends on workload, configuration, and thermal conditions. Sources listed in the footer.</p>`
- **After**: `<p class="fineprint reveal">Apple-published “up to” comparisons, not independent lab tests. M4 Max configuration: 16&#8209;core CPU, 40&#8209;core GPU. M1 Max configuration: 10&#8209;core CPU, 32&#8209;core GPU. Real-world performance depends on workload, configuration, and thermal conditions. Sources listed in the footer.</p>`

#### Line 549: Armor Section Title
- **Before**: `<h2 class="h2" id="armor-title">2.15 kg of <em>quiet</em>.</h2>`
- **After**: `<h2 class="h2" id="armor-title">2.15&nbsp;kg of <em>quiet</em>.</h2>`

#### Line 550: Armor Section Note
- **Before**: `<p class="section__note">Space Black anodized aluminum, a 1.68 cm hinge, and a finish that keeps the light where it belongs.</p>`
- **After**: `<p class="section__note">Space Black anodized aluminum, a 1.68&nbsp;cm hinge, and a finish that keeps the light where it belongs.</p>`

#### Lines 598, 599: Armor Gallery Edge Card
- **Before (Line 598)**: `<h3 class="gallery__title">A 1.68 cm edge.</h3>`
- **After (Line 598)**: `<h3 class="gallery__title">A 1.68&nbsp;cm edge.</h3>`
- **Before (Line 599)**: `<p>Thin enough to carry under one arm. Strong enough to run a 40-core GPU, three Thunderbolt 5 ports, and a 100Wh battery.</p>`
- **After (Line 599)**: `<p>Thin enough to carry under one arm. Strong enough to run a 40&#8209;core GPU, three Thunderbolt 5 ports, and a 100&nbsp;Wh battery.</p>`

#### Lines 608, 609: Armor Gallery Spec Grid
- **Before (Line 608)**: `<div><dt>Peak HDR</dt><dd>1,600 nits</dd></div>`
- **After (Line 608)**: `<div><dt>Peak HDR</dt><dd>1,600&nbsp;nits</dd></div>`
- **Before (Line 609)**: `<div><dt>Camera</dt><dd>12MP Center Stage</dd></div>`
- **After (Line 609)**: `<div><dt>Camera</dt><dd>12&nbsp;MP Center Stage</dd></div>`

---

### Section E: Technical Specifications (Lines 625–692)

#### Line 625: Specs Section Note
- **Before**: `<p class="section__note">16-inch MacBook Pro with M4 Max. Launch configuration, October 2024.</p>`
- **After**: `<p class="section__note">16&#8209;inch MacBook Pro with M4 Max. Launch configuration, October 2024.</p>`

#### Line 636: Specs DL Enclosure
- **Before**: `<dd>MacBook Pro (16-inch, 2024)</dd>`
- **After**: `<dd>MacBook Pro (16&#8209;inch, 2024)</dd>`

#### Line 640: Specs DL Chip
- **Before**: `<dd>Apple M4 Max — up to 16-core CPU (12 performance + 4 efficiency), up to 40-core GPU, 16-core Neural Engine, hardware-accelerated ray tracing</dd>`
- **After**: `<dd>Apple M4 Max — up to 16&#8209;core CPU (12&nbsp;performance + 4&nbsp;efficiency), up to 40&#8209;core GPU, 16&#8209;core Neural Engine, hardware-accelerated ray tracing</dd>`

#### Line 644: Specs DL Display
- **Before**:
  ```html
  <dd>16.2-inch Liquid Retina XDR, 3456 × 2234 at 254 ppi, ProMotion up to 120Hz, 1,000,000:1 contrast, 1,000 nits sustained / 1,600 nits peak HDR, optional nano-texture glass</dd>
  ```
- **After**:
  ```html
  <dd>16.2&#8209;inch Liquid Retina XDR, 3456&nbsp;&times;&nbsp;2234 at 254&nbsp;ppi, ProMotion up to 120&nbsp;Hz, 1,000,000:1 contrast, 1,000&nbsp;nits sustained / 1,600&nbsp;nits peak HDR, optional nano-texture glass</dd>
  ```

#### Line 648: Specs DL Unified Memory
- **Before**: `<dd>36GB unified memory standard; configurable up to 128GB</dd>`
- **After**: `<dd>36&nbsp;GB unified memory standard; configurable up to 128&nbsp;GB</dd>`

#### Line 652: Specs DL SSD Storage
- **Before**: `<dd>1TB SSD standard; configurable up to 8TB</dd>`
- **After**: `<dd>1&nbsp;TB SSD standard; configurable up to 8&nbsp;TB</dd>`

#### Line 656: Specs DL Battery & Power
- **Before**: `<dd>Up to 21 hours video playback, up to 14 hours wireless web; 100Wh lithium-polymer</dd>`
- **After**: `<dd>Up to 21&nbsp;hours video playback, up to 14&nbsp;hours wireless web; 100&nbsp;Wh lithium-polymer</dd>`

#### Line 660: Specs DL Power Adapter
- **Before**: `<dd>140W USB-C power adapter; MagSafe 3 charging</dd>`
- **After**: `<dd>140&nbsp;W USB-C power adapter; MagSafe 3 charging</dd>`

#### Line 664: Specs DL Ports
- **Before**: `<dd>Three Thunderbolt 5 (USB-C) at up to 120Gb/s, HDMI, SDXC card slot, MagSafe 3, 3.5mm headphone jack</dd>`
- **After**: `<dd>Three Thunderbolt 5 (USB-C) at up to 120&nbsp;Gb/s, HDMI, SDXC card slot, MagSafe 3, 3.5&nbsp;mm headphone jack</dd>`

#### Line 668: Specs DL Camera
- **Before**: `<dd>12MP Center Stage camera with Desk View</dd>`
- **After**: `<dd>12&nbsp;MP Center Stage camera with Desk View</dd>`

#### Line 684: Specs DL Dimensions & Weight
- **Before**: `<dd>35.57 cm wide × 24.81 cm deep × 1.68 cm high; 2.15 kg</dd>`
- **After**: `<dd>35.57&nbsp;cm wide &times;&nbsp;24.81&nbsp;cm deep &times;&nbsp;1.68&nbsp;cm high; 2.15&nbsp;kg</dd>`

#### Line 692: Specs DL Base Pricing
- **Before**: `<dd>From $3,499 (U.S.) — 14-core CPU, 32-core GPU, 36GB unified memory, 1TB SSD</dd>`
- **After**: `<dd>From $3,499 (U.S.) — 14&#8209;core CPU, 32&#8209;core GPU, 36&nbsp;GB unified memory, 1&nbsp;TB SSD</dd>`

---

### Section F: Models & Outro (Lines 714–804)

#### Line 714: Model 1 Name
- **Before**: `<h3 class="model__name">14-inch<br>MacBook Pro</h3>`
- **After**: `<h3 class="model__name">14&#8209;inch<br>MacBook Pro</h3>`

#### Lines 718–721: Model 1 Specs DL
- **Before (Line 718)**: `<div><dt>CPU</dt><dd>10-core</dd></div>`
- **After (Line 718)**: `<div><dt>CPU</dt><dd>10&#8209;core</dd></div>`
- **Before (Line 719)**: `<div><dt>GPU</dt><dd>10-core</dd></div>`
- **After (Line 719)**: `<div><dt>GPU</dt><dd>10&#8209;core</dd></div>`
- **Before (Line 720)**: `<div><dt>Bandwidth</dt><dd>120 GB/s</dd></div>`
- **After (Line 720)**: `<div><dt>Bandwidth</dt><dd>120&nbsp;GB/s</dd></div>`
- **Before (Line 721)**: `<div><dt>Memory</dt><dd>Up to 32GB</dd></div>`
- **After (Line 721)**: `<div><dt>Memory</dt><dd>Up to 32&nbsp;GB</dd></div>`

#### Line 724: Model 1 Distinct Link Label
- **Before**:
  ```html
  See it at Apple <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr-only"> (opens in a new tab)</span>
  ```
- **After**:
  ```html
  Configure M4 at Apple <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr-only"> (opens in a new tab)</span>
  ```

#### Line 730: Model 2 Name
- **Before**: `<h3 class="model__name">14- or 16-inch<br>MacBook Pro</h3>`
- **After**: `<h3 class="model__name">14-&nbsp;or&nbsp;16&#8209;inch<br>MacBook Pro</h3>`

#### Lines 734–737: Model 2 Specs DL
- **Before (Line 734)**: `<div><dt>CPU</dt><dd>Up to 14-core</dd></div>`
- **After (Line 734)**: `<div><dt>CPU</dt><dd>Up to 14&#8209;core</dd></div>`
- **Before (Line 735)**: `<div><dt>GPU</dt><dd>Up to 20-core</dd></div>`
- **After (Line 735)**: `<div><dt>GPU</dt><dd>Up to 20&#8209;core</dd></div>`
- **Before (Line 736)**: `<div><dt>Bandwidth</dt><dd>273 GB/s</dd></div>`
- **After (Line 736)**: `<div><dt>Bandwidth</dt><dd>273&nbsp;GB/s</dd></div>`
- **Before (Line 737)**: `<div><dt>Memory</dt><dd>Up to 64GB</dd></div>`
- **After (Line 737)**: `<div><dt>Memory</dt><dd>Up to 64&nbsp;GB</dd></div>`

#### Line 740: Model 2 Distinct Link Label
- **Before**:
  ```html
  See it at Apple <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr-only"> (opens in a new tab)</span>
  ```
- **After**:
  ```html
  Configure M4 Pro at Apple <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr-only"> (opens in a new tab)</span>
  ```

#### Line 746: Model 3 Name
- **Before**: `<h3 class="model__name">16-inch<br>MacBook Pro</h3>`
- **After**: `<h3 class="model__name">16&#8209;inch<br>MacBook Pro</h3>`

#### Lines 750–753: Model 3 Specs DL
- **Before (Line 750)**: `<div><dt>CPU</dt><dd>Up to 16-core</dd></div>`
- **After (Line 750)**: `<div><dt>CPU</dt><dd>Up to 16&#8209;core</dd></div>`
- **Before (Line 751)**: `<div><dt>GPU</dt><dd>Up to 40-core</dd></div>`
- **After (Line 751)**: `<div><dt>GPU</dt><dd>Up to 40&#8209;core</dd></div>`
- **Before (Line 752)**: `<div><dt>Bandwidth</dt><dd>546 GB/s</dd></div>`
- **After (Line 752)**: `<div><dt>Bandwidth</dt><dd>546&nbsp;GB/s</dd></div>`
- **Before (Line 753)**: `<div><dt>Memory</dt><dd>Up to 128GB</dd></div>`
- **After (Line 753)**: `<div><dt>Memory</dt><dd>Up to 128&nbsp;GB</dd></div>`

#### Line 756: Model 3 Distinct Link Label
- **Before**:
  ```html
  See it at Apple <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr-only"> (opens in a new tab)</span>
  ```
- **After**:
  ```html
  Configure M4 Max at Apple <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-external"/></svg><span class="sr-only"> (opens in a new tab)</span>
  ```

#### Lines 803, 804: Footer Source Links
- **Before (Line 803)**:
  ```html
  <li><a href="https://support.apple.com/en-us/121554" target="_blank" rel="noopener noreferrer">Apple Support — 16-inch specs<span class="sr-only"> (opens in a new tab)</span></a></li>
  ```
- **After (Line 803)**:
  ```html
  <li><a href="https://support.apple.com/en-us/121554" target="_blank" rel="noopener noreferrer">Apple Support — 16&#8209;inch specs<span class="sr-only"> (opens in a new tab)</span></a></li>
  ```
- **Before (Line 804)**:
  ```html
  <li><a href="https://support.apple.com/en-us/121553" target="_blank" rel="noopener noreferrer">Apple Support — 14-inch specs<span class="sr-only"> (opens in a new tab)</span></a></li>
  ```
- **After (Line 804)**:
  ```html
  <li><a href="https://support.apple.com/en-us/121553" target="_blank" rel="noopener noreferrer">Apple Support — 14&#8209;inch specs<span class="sr-only"> (opens in a new tab)</span></a></li>
  ```

---

## 5. Verification Method

To independently verify the patch plan, execute the following commands:

1. **Verify Dry-Run Patch Applicability**:
   ```bash
   patch --dry-run -p1 index.html < .agents/teamwork/teamwork_preview_explorer_m1_1/index.html.patch
   ```
   *Expected Output*: `patching file index.html` with exit code `0`.

2. **Verify Elimination of Breaking Spaces Across All Units in `index.html`**:
   ```bash
   python3 -c "
   import re
   with open('index.html') as f:
       for i, l in enumerate(f, 1):
           if i in [10, 15]: continue
           if re.search(r'\b\d+(\.\d+)?\s+(kg|GB/s|Gb/s|cm|mm|GB|TB|Hz|nits|hr|hours|Wh|W|MP|ppi)\b', l):
               print(f'Unescaped unit at line {i}: {l.strip()}')
   "
   ```
   *Expected Output*: 0 matches.

3. **Verify Distinct Model Link Labels**:
   ```bash
   grep -n "Configure M4" index.html
   ```
   *Expected Output*: Exactly three lines with "Configure M4 at Apple", "Configure M4 Pro at Apple", and "Configure M4 Max at Apple".

4. **Verify Font Preloads**:
   ```bash
   grep -n 'rel="preload"' index.html
   ```
   *Expected Output*: Exactly 3 preload tags (`instrument-sans`, `instrument-serif-italic`, and `geist-mono`).
