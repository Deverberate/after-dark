# Handoff Report — Exploration & Specification Survey 3
**Agent**: `teamwork_preview_explorer_survey_3`
**Focus**: Interactive Features, Motion Design, Audio System, Telemetry HUD, and Playwright Verification Strategy (R2, R3, R4, R5, Acceptance Criteria)
**Date**: 2026-11-07T20:02:00Z

---

## 1. Observation

### 1.1 Existing Codebase Architecture & Key Locations
- **`index.html`** (829 lines):
  - **Hero Section** (lines 105–198):
    - Title: `<h1 class="hero__title" id="hero-title">` (lines 116–119)
    - Action buttons: `.hero__actions .btn--solid`, `.hero__actions .btn--ghost` (lines 123–132)
    - Stat values: `.hero__stats dd` with values `16 cores`, `40 cores`, `546 GB/s`, `21 hr` (lines 134–151)
    - Hero Image Container: `<figure class="hero__media reveal">` enclosing `<div class="hero__frame">` with `picture` containing `assets/images/m4-open.jpg` (1841×2994) and existing decorative HUD overlays (`.hud--tl`, `.hud--tr`, `.hud--bl`, `.hud--br`, `.hud__cross`, lines 154–175)
  - **Machine Section** (lines 203–291): `#machine` with `m4-closed.jpg` and `.machine__details`
  - **Silicon Section** (lines 296–466): `#silicon` with `.chip-table` (lines 305–368), `.bandwidth` with `.bars__fill` values (120, 273, 546 GB/s, lines 375–395), `.workload` selector with 3 radio inputs (`everyday`, `professional`, `extreme`, lines 398–433), and `#die-canvas` (lines 435–464)
  - **Proof Section** (lines 471–540): `#proof` with `.proof__stat` `3.5×` (lines 480–484), 6 `.bench__row` benchmark bars (`Redshift` 100%, `Neural Engine` 86%, `Xcode` 63%, `CPU` 63%, `GPU` 54%, `Topaz` 46%, lines 486–535)
  - **Armor Section** (lines 545–614): `#armor` with `.gallery` containing 3 `.gallery__card` figures:
    - Card 1: `assets/images/keyboard.jpg` (`1100×820`, lines 554–569)
    - Card 2: `assets/images/lid.jpg` (`900×760`, lines 571–586)
    - Card 3: `assets/images/edge.jpg` (`1100×760`, lines 588–603)
  - **Specs Section** (lines 619–698): `#specs` with `.spec-table` and `#print-specs` button
  - **Models Section & Outro** (lines 703–775): `#models` with 3 `.model` cards and `.outro`
  - **Footer** (lines 778–824): `.site-footer` with `#motion-toggle` button (lines 817–820)

### 1.2 Existing Motion & Observer Implementations
- **`assets/styles.css`**:
  - Reveal styles (lines 2414–2433):
    ```css
    .js .reveal {
      opacity: 0;
      transform: translateY(26px);
      transition: opacity 0.85s var(--ease), transform 0.85s var(--ease);
    }
    .js .reveal.is-in { opacity: 1; transform: none; }
    .js .gallery__card:nth-child(2), .js .models__grid .model:nth-child(2) { transition-delay: 0.08s; }
    .js .gallery__card:nth-child(3), .js .models__grid .model:nth-child(3) { transition-delay: 0.16s; }
    ```
  - Benchmark bars (lines 1874–1885):
    ```css
    .bench__fill {
      display: block; width: 0; height: 100%;
      background: linear-gradient(90deg, rgba(230, 237, 241, 0.82), var(--ice-dim) 52%, var(--red) 100%);
      transition: width 1.35s var(--ease);
    }
    .is-in .bench__fill, .no-js .bench__fill { width: var(--value); }
    ```
  - Motion tokens in `:root` (lines 41–69): `--ease: cubic-bezier(0.16, 1, 0.3, 1)`, `--obsidian: #050607`, `--panel: #0b0f11`, `--ice: #e6edf1`, `--red: #e10600`, `--blue-glow: rgba(112, 170, 204, 0.18)`
  - Reduced motion media query (lines 2462–2504): sets `animation: none !important`, `transition: none !important` on `*` and `.reveal`
- **`assets/main.js`**:
  - Global motion state: `motionEnabled` checked via `localStorage.getItem('after-dark-motion')` and `matchMedia('(prefers-reduced-motion: reduce)')` (lines 15–68)
  - Reveal observer: binary `entry.target.classList.add('is-in')` with single threshold `0.12` (lines 127–144)
  - Workload selector: radio listener updating `#fit-name`, `#fit-model`, `#fit-copy` without URL query param sync (lines 281–326)
  - Pointerglow on hero: queries `hero.getBoundingClientRect()` on pointermove (lines 254–276)
  - Zero existing audio system or Web Audio API code
  - Zero existing reticle pins or hardware inspection pins
  - Zero existing telemetry HUD tray

---

## 2. Logic Chain

1. **R2 (Scroll, Micro-Interactions & Haptics)**:
   - *Observation*: The current `.reveal` system uses a uniform `translateY(26px)` with hardcoded delays on only two arbitrary cards.
   - *Deduction*: To achieve award-winning motion design and meet the criterion of $\ge 3$ distinct timing offsets per section, sections must implement cascading entry tiers (Tier 1: Section Header/Label, Tier 2: Core Media/Visual, Tier 3: Copy/Specs/Actions, Tier 4: Supporting Metrics/Fineprint).
   - *Parallax Deduction*: Hero frame has `aspect-ratio: 4/5` and `overflow-x: clip` on body. Applying a passive scroll multiplier `translateY(calc(var(--hero-scroll-y) * 0.16))` directly to the inner `picture > img` layer inside `.hero__frame` creates optical depth without altering layout or clipping.
   - *Performance Deductions*: All animations must modify only `transform` and `opacity`. Scrolling calculations must run inside the single existing `requestAnimationFrame` loop in `onScroll`, caching bounding boxes on `resize` to avoid layout thrashing.
   - *Glitch/Scanline Deduction*: A tactical entry effect on section headings (`#silicon-title`, `.hero__title`) matches Wayne Tech branding. Using a 0.65s CSS `@keyframes batGlitch` with chromatic text-shadow (`--red` and `--blue-glow`) and clip-path offsets creates an instantaneous terminal-lock aesthetic that automatically settles and runs zero perpetual overhead.
   - *Haptic Feedback*: Mobile browsers supporting `navigator.vibrate` should receive crisp tactile pulses (`8ms` to `25ms`) on tactile actions (workload switch, pin click, HUD toggle, nav open/close).

2. **R3 (Wayne Tech Hardware Inspection Pins)**:
   - *Observation*: `.hero__frame` (aspect ratio 4:5) and `.gallery__card .gallery__media` (aspect ratio ~4:3) are positioned containers with explicit `position: relative`.
   - *Deduction*: Placing pins as percentage-positioned `<button class="pin">` elements directly within these containers guarantees that they scale and reposition with 100% precision on window resize.
   - *Coordinate Formulation*:
     - Hero image (`m4-open.jpg`): Center screen display $\rightarrow$ (Top: 28%, Left: 48%); Thermal chassis / M4 Max package $\rightarrow$ (Top: 66%, Left: 50%); Left Thunderbolt 5 / MagSafe array $\rightarrow$ (Top: 80%, Left: 20%).
     - Armor Card 1 (Keyboard): Touch ID & Scissor Mechanism $\rightarrow$ (Top: 44%, Left: 54%).
     - Armor Card 2 (Lid): Space Black anodized seal $\rightarrow$ (Top: 48%, Left: 48%).
     - Armor Card 3 (Edge): 1.68 cm structural profile $\rightarrow$ (Top: 50%, Left: 64%).
   - *Accessibility Deduction*: Pins must be native `<button>` elements with `aria-expanded`, `aria-controls`, and `aria-label`. They must open on Click / Enter / Space, close on Escape or outside click, and manage focus safely without trapping.

3. **R4 (Persistent Collapsible Telemetry Tray)**:
   - *Observation*: Viewport bottom-right must host a HUD tray without colliding with the mobile menu or obscuring `.site-footer`.
   - *Deduction*: Positioning with `position: fixed; bottom: calc(1rem + env(safe-area-inset-bottom)); right: calc(1rem + env(safe-area-inset-right)); z-index: 90;` keeps it accessible.
   - *Footer Avoidance*: Observing `.site-footer` via `IntersectionObserver` enables translating the tray upwards by the exact intersecting height plus margin, preventing any overlap with footer links or the motion toggle.
   - *Data Synchronization*:
     - Section name & scroll %: updated from scroll listener.
     - Gotham clock: bound to existing `tick()` formatter.
     - Active workload recommendation: bound to `workloadInputs` change events.
     - Sine wave / bar oscillation: 2D canvas running at 30fps with low CPU load, pausing when tray is collapsed or off-screen.

4. **R5 (High-Fidelity Audio Sprite System)**:
   - *Observation*: External audio files introduce network requests, CORS risks, and asset loading latency.
   - *Deduction*: Programmatic synthesis via Web Audio API (`AudioContext`) is 100% self-contained, instant, zero-byte network overhead, and allows fine-grained sound sculpting for all 4 required sounds (mechanical click, diagnostic chirp, sonar sweep, sub-bass tactical lock).
   - *Policy & Reduced Motion Compliance*: Browsers block audio before user gesture; `AudioContext` must initialize/resume on first click. If `prefers-reduced-motion` is active, audio defaults to disabled. Audio toggle must persist in `localStorage` under `'after-dark-audio'`.

5. **Verification Strategy**:
   - *Deduction*: A comprehensive Playwright test script (`tests/verify.spec.js`) covering all 7 acceptance criteria blocks will establish an ironclad regression harness for the implementation team.

---

## 3. Caveats

1. **Web Audio Autoplay Restrictions**: Browsers (WebKit, Chromium) suspend un-gestured `AudioContext`. Audio cannot play before user interaction. The `AudioManager` must remain in `suspended` or muted state until explicit user interaction (click/toggle).
2. **Vibration API Platform Support**: `navigator.vibrate` is supported on Android/Chromium, but ignored or omitted on iOS Safari. All vibration calls must be safely wrapped in feature detection (`'vibrate' in navigator`) and treated as an enhancement.
3. **Aspect Ratio & Pin Tooltip Edge Clamping**: On mobile viewports (<600px), a tooltip extending upwards from a pin near the edge might exceed the viewport horizontally. Tooltip callout positioning must include boundary clamping (`left: 50%; transform: translateX(-50%)` with `max-width: 80vw`).

---

## 4. Conclusion & Concrete Design Specifications

### Specification 1: R2 (Scroll Animations, Micro-Interactions & Haptics)

#### A. Layered Staggered Section Entry Engine
Every section features $\ge 3$ distinct timing offsets configured via CSS variables and triggered via an enhanced `IntersectionObserver`:
- **CSS Architecture**:
  ```css
  /* Layered Stagger Engine */
  .js .reveal-group .reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.8s var(--ease), transform 0.8s var(--ease);
    transition-delay: calc(var(--stagger, 0) * 110ms);
    will-change: transform, opacity;
  }
  .js .reveal-group.is-in .reveal,
  .js .reveal.is-in {
    opacity: 1;
    transform: translateY(0);
  }
  ```
- **Stagger Offsets per Section (Detailed Map)**:
  - **01 Hero**:
    - `--stagger: 0` (0ms): `.hero__copy .label`, `.hero__kicker`
    - `--stagger: 1` (110ms): `.hero__title`
    - `--stagger: 2` (220ms): `.hero__lede`
    - `--stagger: 3` (330ms): `.hero__actions`
    - `--stagger: 4` (440ms): `.hero__stats`
    - `--stagger: 2` (220ms): `.hero__media`
  - **02 Machine**:
    - `--stagger: 0` (0ms): `.section__head .label`, `h2`
    - `--stagger: 1` (110ms): `.section__note`
    - `--stagger: 2` (220ms): `.machine__media`
    - `--stagger: 3` (330ms): `.machine__details`
  - **03 Silicon**:
    - `--stagger: 0` (0ms): `.section__head`
    - `--stagger: 1` (110ms): `.chip-table-wrap`
    - `--stagger: 2` (220ms): `.bandwidth`
    - `--stagger: 3` (330ms): `.workload`
    - `--stagger: 4` (440ms): `.die`
  - **04 Proof**:
    - `--stagger: 0` (0ms): `.section__head`
    - `--stagger: 1` (110ms): `.proof__hero`
    - `--stagger: 2..7` (220ms..770ms): `.bench__row:nth-child(n)`
    - `--stagger: 8` (880ms): `.fineprint`
  - **05 Armor**:
    - `--stagger: 0` (0ms): `.section__head`
    - `--stagger: 1` (110ms): `.gallery__card:nth-child(1)`
    - `--stagger: 2` (220ms): `.gallery__card:nth-child(2)`
    - `--stagger: 3` (330ms): `.gallery__card:nth-child(3)`
    - `--stagger: 4` (440ms): `.armor__strip`
  - **06 Specs**:
    - `--stagger: 0` (0ms): `.specs__head`
    - `--stagger: 1` (110ms): `#print-specs`
    - `--stagger: 2` (220ms): `.spec-table`
  - **07 Models**:
    - `--stagger: 0` (0ms): `.section__head`
    - `--stagger: 1` (110ms): `.model:nth-child(1)`
    - `--stagger: 2` (220ms): `.model:nth-child(2)`
    - `--stagger: 3` (330ms): `.model:nth-child(3)`
    - `--stagger: 4` (440ms): `.outro`

#### B. Hero Imagery Parallax Depth
- Calculated in `onScroll` using cached hero bounds:
  ```js
  // Inside existing requestAnimationFrame loop in onScroll
  if (heroRect && window.scrollY < heroRect.bottom + window.innerHeight) {
    const scrollRatio = Math.max(0, Math.min(1, window.scrollY / (heroRect.height || 1)));
    const parallaxY = (scrollRatio * 48).toFixed(2);
    heroMediaImg.style.transform = `translate3d(0, ${parallaxY}px, 0) scale(1.02)`;
  }
  ```
- Disabled when `!motionEnabled` or reduced motion: `heroMediaImg.style.transform = '';`

#### C. Magnetic / Scale Hover Micro-Interactions
- Applied to buttons (`.btn`, `.specs__print`, `.menu-toggle`, `.motion-toggle`) and cards (`.gallery__card`, `.model`):
  ```css
  .btn, .specs__print, .menu-toggle, .motion-toggle {
    transition: transform 0.22s var(--ease), box-shadow 0.22s var(--ease), border-color 0.22s var(--ease);
  }
  .btn:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 16px var(--red-glow);
  }
  .gallery__card, .model {
    transition: transform 0.35s var(--ease), border-color 0.35s var(--ease), box-shadow 0.35s var(--ease);
  }
  .gallery__card:hover, .model:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(112, 170, 204, 0.12);
  }
  ```
- Fine pointer magnetic script (`pointermove` with cached rect): offsets element inner content by max $\pm 6\text{px}$ based on cursor delta from center.

#### D. Stat Counter & Benchmark Bar Animations
- **Stat Counter Engine**:
  - Elements: `.hero__stats dd` (`16`, `40`, `546`, `21`), `.proof__stat` (`3.5`), `.bars__value` (`120`, `273`, `546`).
  - Script utilizes `requestAnimationFrame` with `easeOutExpo` over $1200\text{ms}$.
  - When reduced motion is on: immediately populates target values.
- **Benchmark Bar Fill Animation**:
  - Triggered on scroll entry via `.is-in`:
    ```css
    .bench__fill {
      width: 0;
      transition: width 1.2s var(--ease);
      transition-delay: calc(var(--row-index, 0) * 80ms + 150ms);
    }
    .is-in .bench__fill {
      width: var(--value);
    }
    ```

#### E. Subtle Tactical Glitch/Scanline Heading Effect
- Applied to `.section__head.is-in .h2`:
  ```css
  @keyframes batGlitch {
    0% { clip-path: inset(0 0 0 0); transform: translate(0); text-shadow: none; }
    15% { clip-path: inset(20% 0 50% 0); transform: translate(-2px, 1px); text-shadow: -1px 0 var(--red), 1px 0 var(--blue-glow); }
    30% { clip-path: inset(60% 0 15% 0); transform: translate(2px, -1px); text-shadow: 1px 0 var(--red), -1px 0 var(--blue-glow); }
    45% { clip-path: inset(10% 0 70% 0); transform: translate(-1px, 0); text-shadow: -1px 0 var(--red); }
    60% { clip-path: inset(40% 0 30% 0); transform: translate(1px, 0); text-shadow: 1px 0 var(--blue-glow); }
    75% { clip-path: inset(0 0 0 0); transform: translate(0); text-shadow: none; }
    100% { clip-path: inset(0 0 0 0); transform: translate(0); text-shadow: none; }
  }
  .js .reveal.is-in .h2.glitch-heading {
    animation: batGlitch 0.65s var(--ease) 1;
  }
  ```

#### F. Vibration API Haptics
- Standardized helper:
  ```js
  const triggerHaptic = (pattern = 10) => {
    if (!motionEnabled || prefersReducedMotion()) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch {}
    }
  };
  ```
- Interaction triggers:
  - Workload radio switch: `triggerHaptic([12, 24, 15])`
  - Inspection pin click/focus: `triggerHaptic(18)`
  - Telemetry HUD toggle: `triggerHaptic(25)`
  - Mobile nav open: `triggerHaptic(15)`, close: `triggerHaptic(10)`

---

### Specification 2: R3 (Wayne Tech Hardware Inspection Pins)

#### A. Architecture & DOM Structure
Each pin is a self-contained `<button class="pin">` positioned via CSS percentage coordinates inside its relative parent (`.hero__frame` or `.gallery__media`):
```html
<button class="pin" type="button" aria-expanded="false" aria-controls="pin-callout-1" aria-label="Inspect Optic Reticle: Liquid Retina XDR Display" style="--pin-top: 28%; --pin-left: 48%;">
  <span class="pin__target" aria-hidden="true">
    <svg class="pin__reticle" viewBox="0 0 32 32" focusable="false">
      <!-- Outer Pulsing Radar Ring -->
      <circle class="pin__pulse" cx="16" cy="16" r="10" />
      <!-- Tactical Corner Brackets -->
      <path class="pin__bracket" d="M6 12 V6 H12 M20 6 H26 V12 M26 20 V26 H20 M12 26 H6 V20" />
      <!-- Center Targeting Cross -->
      <line class="pin__cross" x1="16" y1="11" x2="16" y2="21" />
      <line class="pin__cross" x1="11" y1="16" x2="21" y2="16" />
    </svg>
    <span class="pin__dot"></span>
  </span>

  <!-- Tooltip Callout Card -->
  <div class="pin__callout" id="pin-callout-1" role="tooltip">
    <div class="pin__callout-header">
      <span class="pin__badge">SYS // 01</span>
      <span class="pin__status"><span class="pin__status-pulse"></span>ACTIVE</span>
    </div>
    <h4 class="pin__title">Liquid Retina XDR</h4>
    <p class="pin__spec">16.2″ · 3456×2234 at 254 ppi · 1,600 nits peak HDR · 1,000,000:1 contrast · ProMotion 120Hz</p>
  </div>
</button>
```

#### B. Exact Coordinate & Spec Placement (6 Pins Total)
1. **Hero Pin 1 (Optic Reticle — Liquid Retina XDR)**:
   - Target: `.hero__frame` (Hero image `m4-open.jpg`)
   - Coordinate: `top: 28%; left: 48%;`
   - Badge: `SYS // 01` | Title: `Liquid Retina XDR Display`
   - Spec: `16.2″ · 3456×2234 · 1,600 nits peak HDR · 1,000,000:1 contrast · ProMotion 120Hz · Nano-texture option`
2. **Hero Pin 2 (Core Package Reticle — Apple Silicon M4 Max)**:
   - Target: `.hero__frame` (Keyboard/chassis center)
   - Coordinate: `top: 66%; left: 50%;`
   - Badge: `SYS // 02` | Title: `M4 Max Package`
   - Spec: `16-Core CPU (12P + 4E) · 40-Core GPU · 16-Core Neural Engine · 546 GB/s Unified Memory Bandwidth`
3. **Hero Pin 3 (I/O Vector Reticle — Thunderbolt 5 Array)**:
   - Target: `.hero__frame` (Left chassis edge)
   - Coordinate: `top: 80%; left: 22%;`
   - Badge: `SYS // 03` | Title: `Thunderbolt 5 & MagSafe`
   - Spec: `120 Gb/s Bandwidth · 3× TB5 ports · Up to three 6K external displays · 140W Fast Charging`
4. **Armor Card 1 Pin (Input Reticle — Magic Keyboard & Touch ID)**:
   - Target: `.gallery__card:nth-child(1) .gallery__media` (`keyboard.jpg`)
   - Coordinate: `top: 44%; left: 54%;`
   - Badge: `ARMOR // 01` | Title: `Touch ID & Scissor Switch`
   - Spec: `Full-height function row · Secure Enclave AES-256 · 1.0mm key travel · Ambient light sensor`
5. **Armor Card 2 Pin (Finish Reticle — Space Black Anodization)**:
   - Target: `.gallery__card:nth-child(2) .gallery__media` (`lid.jpg`)
   - Coordinate: `top: 48%; left: 48%;`
   - Badge: `ARMOR // 02` | Title: `Space Black Enclosure`
   - Spec: `Breakthrough chemical anodization seal · Nano-scale oxide surface repels fingerprints · 100% recycled Al`
6. **Armor Card 3 Pin (Chassis Reticle — 1.68 cm Unibody Profile)**:
   - Target: `.gallery__card:nth-child(3) .gallery__media` (`edge.jpg`)
   - Coordinate: `top: 50%; left: 64%;`
   - Badge: `ARMOR // 03` | Title: `1.68 cm Unibody Profile`
   - Spec: `1.68 cm thin · 2.15 kg total weight · 100Wh battery · Up to 21 hours continuous video playback`

#### C. Keyboard Accessibility & Tactical Interaction
- Accessible via standard `Tab` flow. Focus produces visible high-contrast ring (`outline: 2px solid var(--red); outline-offset: 3px;`).
- `Enter` / `Space` toggles `aria-expanded="true/false"`.
- `Escape` dismisses the active pin tooltip and retains focus on the triggering button.
- Clicking outside closes any open pin.
- Activation triggers:
  - Sound: Diagnostic chirp (`audioManager.playChirp()`)
  - Haptic: Single lock-on pulse (`triggerHaptic(18)`)
  - Reticle Animation: corners snap inward (`transform: rotate(45deg) scale(0.9)`), outer pulse ring flashes red.

---

### Specification 3: R4 (Persistent Collapsible Telemetry Tray)

#### A. DOM Hierarchy & Viewport HUD Placement
```html
<aside class="telemetry-tray" id="telemetry-tray" aria-label="Wayne Applied Sciences Telemetry HUD">
  <!-- Collapsed Monospace Bar (Always Visible Trigger) -->
  <button class="telemetry-bar" id="telemetry-toggle" type="button" aria-expanded="false" aria-controls="telemetry-panel" aria-label="Toggle Batcomputer Telemetry HUD">
    <span class="telemetry-bar__pulse" aria-hidden="true"></span>
    <span class="telemetry-bar__sec" id="telemetry-sec">SEC: 01 HERO</span>
    <span class="telemetry-bar__sep" aria-hidden="true">/</span>
    <span class="telemetry-bar__scroll" id="telemetry-scroll">00%</span>
    <span class="telemetry-bar__sep" aria-hidden="true">/</span>
    <span class="telemetry-bar__time" id="telemetry-time">GTM --:--</span>
    <span class="telemetry-bar__sep" aria-hidden="true">/</span>
    <span class="telemetry-bar__audio" id="telemetry-audio-ind">AUD: OFF</span>
    <span class="telemetry-bar__chevron" aria-hidden="true">▲</span>
  </button>

  <!-- Expanded Diagnostic Panel -->
  <div class="telemetry-panel" id="telemetry-panel" hidden>
    <div class="telemetry-panel__header">
      <div class="telemetry-panel__branding">
        <span class="telemetry-panel__bat" aria-hidden="true">❖</span>
        <span>WAYNE APPLIED SCIENCES // HUD-M4</span>
      </div>
      <button class="telemetry-panel__close" id="telemetry-close" type="button" aria-label="Close Telemetry HUD">
        <span>ESC ✕</span>
      </button>
    </div>

    <!-- Diagnostic Instrumentation Gauges -->
    <div class="telemetry-panel__body">
      <!-- 1. CPU Waveform -->
      <div class="telemetry-panel__gauge-block">
        <div class="telemetry-gauge__label">
          <span>CPU (16-Core) Load</span>
          <span class="telemetry-gauge__val" id="telemetry-cpu-val">28%</span>
        </div>
        <canvas id="telemetry-cpu-canvas" width="240" height="28" aria-label="Simulated CPU utilization waveform"></canvas>
      </div>

      <!-- 2. GPU Waveform -->
      <div class="telemetry-panel__gauge-block">
        <div class="telemetry-gauge__label">
          <span>GPU (40-Core) Ray Trace</span>
          <span class="telemetry-gauge__val" id="telemetry-gpu-val">64%</span>
        </div>
        <canvas id="telemetry-gpu-canvas" width="240" height="28" aria-label="Simulated GPU ray trace waveform"></canvas>
      </div>

      <!-- 3. Memory Flow Visualization -->
      <div class="telemetry-panel__gauge-block">
        <div class="telemetry-gauge__label">
          <span>Memory Bandwidth Stream</span>
          <span class="telemetry-gauge__val">546 GB/s</span>
        </div>
        <div class="telemetry-flow" aria-hidden="true">
          <div class="telemetry-flow__rail">
            <span class="telemetry-flow__packet" style="--delay: 0s"></span>
            <span class="telemetry-flow__packet" style="--delay: 0.25s"></span>
            <span class="telemetry-flow__packet" style="--delay: 0.5s"></span>
            <span class="telemetry-flow__packet" style="--delay: 0.75s"></span>
          </div>
        </div>
      </div>

      <!-- 4. Active Workload Live Sync -->
      <div class="telemetry-panel__workload-sync">
        <span class="telemetry-subhead">Active Profile Fit</span>
        <p class="telemetry-workload-name" id="telemetry-workload-name">M4 Max (16″ Batcomputer)</p>
      </div>

      <!-- 5. Audio Toggle -->
      <div class="telemetry-panel__audio-row">
        <span class="telemetry-subhead">Tactical Audio Synth</span>
        <button class="telemetry-audio-btn" id="telemetry-audio-toggle" type="button" aria-pressed="false">
          <span class="telemetry-audio-btn__dot"></span>
          <span class="telemetry-audio-btn__label">Audio Muted</span>
        </button>
      </div>

      <!-- 6. Quick-Nav Shortcuts -->
      <div class="telemetry-panel__quicknav">
        <span class="telemetry-subhead">Jump Coordinates</span>
        <div class="telemetry-quicknav__links">
          <a href="#hero">01 HERO</a>
          <a href="#machine">02 MACHINE</a>
          <a href="#silicon">03 SILICON</a>
          <a href="#proof">04 PROOF</a>
          <a href="#armor">05 ARMOR</a>
          <a href="#specs">06 SPECS</a>
          <a href="#models">07 MODELS</a>
        </div>
      </div>
    </div>
  </div>
</aside>
```

#### B. Footer Collision Avoidance Logic
To guarantee zero obstruction of footer content:
```js
const tray = document.getElementById('telemetry-tray');
const footer = document.querySelector('.site-footer');
if (tray && footer && 'IntersectionObserver' in window) {
  const footerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const overlap = Math.max(0, window.innerHeight - entry.boundingClientRect.top);
        tray.style.transform = `translate3d(0, -${overlap + 16}px, 0)`;
      } else {
        tray.style.transform = '';
      }
    });
  }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] });
  footerObserver.observe(footer);
}
```

---

### Specification 4: R5 (High-Fidelity Audio Sprite System)

#### A. Web Audio API Synthesis Architecture
A self-contained synthetic audio generator class creating all 4 required sounds on demand:
```js
class WayneAudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.initialized = false;
    this.storageKey = 'after-dark-audio';
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.initialized = true;

      const stored = localStorage.getItem(this.storageKey);
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Muted by default; strictly disabled under reduced motion
      this.enabled = (!reducedMotion && stored === 'on');
      this.syncUI();
    } catch (e) {
      console.warn('Web Audio init failed', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.ensureContext();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.enabled = false;
      return false;
    }
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(this.storageKey, this.enabled ? 'on' : 'off');
    } catch {}
    this.syncUI();
    if (this.enabled) this.playClick();
    return this.enabled;
  }

  syncUI() {
    const toggles = document.querySelectorAll('#telemetry-audio-toggle, [data-audio-toggle]');
    const indicators = document.querySelectorAll('#telemetry-audio-ind');
    toggles.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(this.enabled));
      const lbl = btn.querySelector('.telemetry-audio-btn__label');
      if (lbl) lbl.textContent = this.enabled ? 'Audio Active' : 'Audio Muted';
    });
    indicators.forEach((ind) => {
      ind.textContent = this.enabled ? 'AUD: ON' : 'AUD: OFF';
    });
  }

  // Sound 1: Crisp Mechanical Click
  playClick() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, t);

    osc.type = 'square';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.016);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.025);
  }

  // Sound 2: High-Frequency Diagnostic Chirp
  playChirp() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(3800, t + 0.022);
    osc.frequency.exponentialRampToValueAtTime(2800, t + 0.048);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.055);
  }

  // Sound 3: Radar / Sonar Sweep
  playSweep() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(840, t);
    filter.Q.setValueAtTime(3.5, t);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(960, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.22);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  // Sound 4: Sub-Bass Tactical Lock
  playLock() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, t);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.20);
  }
}
```

#### B. Interaction Mapping
- `playClick()`: Link clicks, menu toggle, telemetry HUD toggle, audio button toggle, spec sheet print button.
- `playChirp()`: Inspection pin hover, pin click/focus, reticle lock-on.
- `playSweep()`: Telemetry panel expansion, section scroll transitions, die-map canvas toggle.
- `playLock()`: Workload selector radio change (`everyday`, `professional`, `extreme`), flagship model card hover.

---

### Specification 5: Verification Strategy & Playwright Test Suite (`tests/verify.spec.js`)

A complete Playwright test suite validating all functional and non-functional acceptance criteria:
```js
// tests/verify.spec.js
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');
const path = require('path');

test.describe('M4 After Dark — High-Fidelity Verification Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('01: Zero critical or serious axe-core accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const seriousOrCritical = results.violations.filter(v =>
      ['critical', 'serious'].includes(v.impact)
    );

    expect(seriousOrCritical).toEqual([]);
  });

  test('02: Reticle hardware inspection pins (minimum 6 pins present and interactive)', async ({ page }) => {
    const pins = page.locator('.pin');
    const pinCount = await pins.count();
    expect(pinCount).toBeGreaterThanOrEqual(6);

    // Verify Hero has >= 3 pins and Armor gallery has >= 3 pins
    const heroPins = page.locator('.hero__frame .pin');
    const armorPins = page.locator('.gallery .pin');
    expect(await heroPins.count()).toBeGreaterThanOrEqual(3);
    expect(await armorPins.count()).toBeGreaterThanOrEqual(3);

    // Test first pin interaction
    const firstPin = pins.first();
    await expect(firstPin).toHaveAttribute('aria-expanded', 'false');

    await firstPin.click();
    await expect(firstPin).toHaveAttribute('aria-expanded', 'true');
    const callout = firstPin.locator('.pin__callout');
    await expect(callout).toBeVisible();

    // Verify technical spec text is present
    const specText = await callout.locator('.pin__spec').textContent();
    expect(specText.length).toBeGreaterThan(15);

    // Test Escape key dismissal
    await page.keyboard.press('Escape');
    await expect(firstPin).toHaveAttribute('aria-expanded', 'false');
  });

  test('03: Telemetry HUD tray toggles collapsed and expanded states', async ({ page }) => {
    const tray = page.locator('#telemetry-tray');
    await expect(tray).toBeVisible();

    const toggle = page.locator('#telemetry-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // Check collapsed status labels
    await expect(page.locator('#telemetry-sec')).toBeVisible();
    await expect(page.locator('#telemetry-scroll')).toBeVisible();

    // Expand HUD
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = page.locator('#telemetry-panel');
    await expect(panel).toBeVisible();

    // Verify diagnostic instruments exist
    await expect(page.locator('#telemetry-cpu-canvas')).toBeVisible();
    await expect(page.locator('#telemetry-gpu-canvas')).toBeVisible();
    await expect(page.locator('#telemetry-workload-name')).toBeVisible();
    await expect(page.locator('.telemetry-quicknav__links a')).toHaveCount(7);

    // Collapse HUD via Close button or Escape
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('04: Telemetry tray avoids collision with page footer', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);

    const trayBox = await page.locator('#telemetry-tray').boundingBox();
    const footerMotionToggle = page.locator('#motion-toggle');
    const toggleBox = await footerMotionToggle.boundingBox();

    // Ensure tray does not overlap the footer motion toggle
    const overlaps = !(
      trayBox.x + trayBox.width < toggleBox.x ||
      trayBox.x > toggleBox.x + toggleBox.width ||
      trayBox.y + trayBox.height < toggleBox.y ||
      trayBox.y > toggleBox.y + toggleBox.height
    );
    expect(overlaps).toBeFalsy();
  });

  test('05: Audio toggle exists, defaults to muted, and persists preference', async ({ page }) => {
    const audioBtn = page.locator('#telemetry-audio-toggle');
    
    // Expand telemetry panel to access toggle
    await page.locator('#telemetry-toggle').click();
    await expect(audioBtn).toBeVisible();

    // Check default muted state
    await expect(audioBtn).toHaveAttribute('aria-pressed', 'false');

    // Activate audio
    await audioBtn.click();
    await expect(audioBtn).toHaveAttribute('aria-pressed', 'true');

    // Check localStorage persistence
    const storedVal = await page.evaluate(() => localStorage.getItem('after-dark-audio'));
    expect(storedVal).toBe('on');

    // Reload page and check persistence
    await page.reload();
    await page.locator('#telemetry-toggle').click();
    await expect(audioBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('06: Workload selector synchronizes with URL query param', async ({ page }) => {
    // Select professional workload
    const proRadio = page.locator('input[name="workload"][value="professional"]');
    await proRadio.check();
    await page.waitForTimeout(200);

    expect(page.url()).toContain('workload=professional');
    await expect(page.locator('#fit-name')).toHaveText('M4 Pro');

    // Select extreme workload
    const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
    await extremeRadio.check();
    await page.waitForTimeout(200);

    expect(page.url()).toContain('workload=extreme');
    await expect(page.locator('#fit-name')).toHaveText('M4 Max');
  });

  test('07: Strict CSS compliance — No transition: all in stylesheet', async () => {
    const cssPath = path.resolve(__dirname, '../assets/styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Regex checking for 'transition: all' or 'transition: ... all ...'
    const transitionAllRegex = /transition\s*:[^;]*\ball\b/i;
    expect(transitionAllRegex.test(cssContent)).toBeFalsy();
  });

  test('08: Visual regression screenshots of all major sections', async ({ page }) => {
    const sections = ['hero', 'machine', 'silicon', 'proof', 'armor', 'specs', 'models'];
    for (const sec of sections) {
      const el = page.locator(`section.${sec}`);
      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await el.screenshot({ path: `tests/screenshots/section-${sec}.png` });
      }
    }
  });

});
```

---

## 5. Verification Method

### 5.1 Independent Code & Static Inspection
1. **CSS Audit for `transition: all`**:
   - Run grep in workspace root:
     ```sh
     grep -rn "transition.*all" assets/styles.css
     ```
   - Expected result: 0 matches.
2. **Interactive HTML Pin Architecture Check**:
   - Inspect `.hero__frame` and `.gallery__card .gallery__media` in `index.html`.
   - Assert $\ge 6$ `<button class="pin">` elements exist with matching SVG reticle and ARIA markup.
3. **Telemetry Tray DOM Placement**:
   - Inspect `#telemetry-tray` in `index.html`.
   - Assert it contains `#telemetry-toggle`, `#telemetry-panel`, `#telemetry-cpu-canvas`, `#telemetry-gpu-canvas`, `#telemetry-audio-toggle`, and the 7 quick-nav anchors.
4. **Web Audio Implementation Check**:
   - Inspect `assets/main.js` for `WayneAudioManager` or `AudioManager` definition.
   - Assert synthesis methods `playClick`, `playChirp`, `playSweep`, and `playLock` exist.

### 5.2 Test Execution (Playwright)
Once implementation is complete, run:
```sh
npx playwright test tests/verify.spec.js
```
- **Passing criteria**: 8/8 tests pass with 0 errors, 0 axe-core violations, and valid screenshot artifacts in `tests/screenshots/`.

### 5.3 Invalidation Conditions
This survey specification is invalidated if:
- Pins are implemented with fixed pixel offsets rather than relative percentage styling (`--pin-top`, `--pin-left`).
- External audio files are introduced that cause 404s or network lag rather than programmatic Web Audio synthesis.
- Telemetry tray overlaps footer buttons or fails to collapse on Escape.
- Any CSS rule introduces `transition: all`.
