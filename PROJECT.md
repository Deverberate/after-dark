# Project: M4 After Dark Upgrade

## Architecture
The M4 After Dark concept study is a high-fidelity, cinematic Batman-themed interactive web experience built on vanilla semantic HTML5, modern CSS3 custom properties, and modular vanilla JavaScript (ES6+).

### System Overview & Data Flow
1. **Presentation Layer (`index.html`, `assets/styles.css`)**:
   - Semantic HTML5 structure across 7 primary sections (`#hero`, `#machine`, `#silicon`, `#proof`, `#armor`, `#specs`, `#models`, plus `.site-footer`).
   - Obsidian/Ice/Signal Red design token palette with hardware-accelerated transitions.
   - Fluid typography with self-hosted `Instrument Sans`, `Instrument Serif`, and `Geist Mono` fonts.
   - Layered responsive media frames (`picture` + WebP / JPEG fallbacks).
2. **Interactive & Motion Engine (`assets/main.js`, `assets/styles.css`)**:
   - Staggered scroll-driven intersection engine using `IntersectionObserver` with tiered CSS variable delays.
   - Passive RAF scroll loop managing sticky header state, progress bar, hero optical parallax, and stat counting.
   - Hardware-accelerated hover micro-interactions (magnetic transform/scale).
   - Tactical glitch/scanline animation triggers on section headings.
   - Vibration API haptic pulses for physical device feedback.
3. **Hardware Inspection Subsystem (`assets/main.js`, `assets/styles.css`)**:
   - Responsive percentage-positioned diagnostic reticle pins on hero and armor gallery images (6 pins minimum).
   - Animated SVG crosshair brackets with pulsing radar rings and tactical lock-on state.
   - Keyboard accessible (`Tab`, `Enter`, `Space`, `Escape`) spec callout tooltips with ARIA attributes and screen-reader announcements.
4. **Persistent Batcomputer Telemetry Tray (`assets/main.js`, `assets/styles.css`)**:
   - Fixed HUD tray at viewport bottom-right displaying section name, scroll depth %, Gotham local time, and audio status.
   - Expandable diagnostic panel featuring 2D canvas animated gauges (simulated CPU/GPU load, memory bandwidth stream), active workload recommendation, and quick-nav shortcuts.
   - Intelligent footer collision avoidance via `IntersectionObserver`.
5. **Wayne Audio Subsystem (`assets/main.js`)**:
   - Zero-dependency programmatic Web Audio API synthesizer (`WayneAudioManager`).
   - 4 distinct synthesized audio sprites: mechanical click, diagnostic chirp, sonar sweep, sub-bass tactical lock.
   - Muted-by-default on first visit, persistent user preference via `localStorage['after-dark-audio']`, and OS `prefers-reduced-motion` synchronization.
6. **Verification & Testing Harness (`tests/verify.spec.js`, `playwright.config.js`)**:
   - Playwright end-to-end test suite integrating `axe-core` for automated accessibility audits (zero critical/serious violations).
   - Opaque-box interaction verification, query parameter sync checks, CSS property validation, and visual regression snapshotting.

---

## Code Layout
```
/Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign/
├── index.html                   # Core semantic DOM, meta tags, and component markup
├── assets/
│   ├── styles.css               # Design system, layout, responsive queries, and animations
│   ├── main.js                  # Application runtime, motion engine, HUD, and audio manager
│   ├── fonts/                   # Self-hosted woff2 font files (Instrument Sans, Serif, Geist Mono)
│   └── images/                  # Responsive WebP and JPEG photography
├── tests/
│   └── verify.spec.js           # Playwright test suite verifying R1-R5 & accessibility
├── package.json                 # Project npm configuration with Playwright & Axe dependencies
├── playwright.config.js         # Playwright test runner configuration
├── PROJECT.md                   # Authoritative project index, milestones, and contracts
├── TEST_INFRA.md                # E2E test methodology and tiered coverage plan
└── TEST_READY.md                # E2E test suite readiness artifact
```

---

## Feature Inventory
Every feature identified during the comprehensive survey is mapped to a milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Non-Breaking Unit Spaces | Inject `&nbsp;` before all units (106+ instances: kg, GB/s, Gb/s, cm, mm, GB, TB, cores, Hz, nits, hr, W, Wh, MP, ppi, inch, ×) | M1 | R1 Spec Miner |
| 2 | Typographic Curly Quotes | Convert straight apostrophe in meta description to curly apostrophe (`Apple’s`) | M1 | R1 Spec Miner |
| 3 | Geist Mono Font Preload | Add `<link rel="preload">` for `assets/fonts/geist-mono.woff2` in `<head>` | M1 | R1 Spec Miner |
| 4 | Tabular Numbers on Chip Table | Add `font-variant-numeric: tabular-nums` to `.chip-table td` and `th` | M1 | R1 Spec Miner |
| 5 | Heading Scroll Margin | Add `scroll-margin-top: 6rem` to heading IDs and `:target` elements | M1 | R1 Spec Miner |
| 6 | Mobile Nav Containment | Add `overscroll-behavior: contain` and `overflow-y: auto` to mobile `.nav` drawer | M1 | R1 Spec Miner |
| 7 | Footer Safe Area Padding | Add `padding-bottom: max(1.75rem, env(safe-area-inset-bottom))` to `.footer__bottom` | M1 | R1 Spec Miner |
| 8 | Workload URL Query Param Sync | Synchronize workload selector radio state with `?workload=...` via `history.replaceState` and restore on load | M1 | R1 Spec Miner |
| 9 | Hero Pointerglow Layout Cache | Cache hero `getBoundingClientRect()` on window resize instead of reading inside `pointermove` | M1 | R1 Spec Miner |
| 10 | Specific Apple Model Link Labels | Replace repeated "See it at Apple" with "Configure M4 at Apple", "Configure M4 Pro at Apple", "Configure M4 Max at Apple" | M1 | R1 Spec Miner |
| 11 | CSS Transition Property Audit | Ensure strict prohibition of `transition: all` across entire stylesheet | M1 | R1 Spec Miner |
| 12 | Layered Scroll Entry Stagger | Replace basic reveal with multi-tier stagger engine (3-8 distinct timing offsets per section) | M2 | R2 Explorer |
| 13 | Hero Image Parallax Depth | Optical scroll parallax on hero image inside `.hero__frame` without layout shift | M2 | R2 Explorer |
| 14 | Magnetic & Scale Micro-Interactions | Magnetic / scale hover effects on buttons, interactive cards, and options | M2 | R2 Explorer |
| 15 | Stat Counter Interpolation | Smooth counter animation (0 to target) for hero stats, ticker stats, and proof multiplier | M2 | R2 Explorer |
| 16 | Scroll-Triggered Benchmark Fills | Animate benchmark and bandwidth bar fill widths upon scroll intersection | M2 | R2 Explorer |
| 17 | Tactical Heading Glitch / Scanline | 0.65s CSS chromatic glitch / scanline entry animation on section titles | M2 | R2 Explorer |
| 18 | Vibration API Haptics | Tactical haptic feedback on workload select, pin toggle, HUD toggle, and menu open/close | M2 | R2 Explorer |
| 19 | 60fps Animation Budget & Reduced Motion | Compositor-only transforms (`transform`, `opacity`), RAF batching, and full `prefers-reduced-motion` compliance | M2 | R2 Explorer |
| 20 | Diagnostic Reticle Pins Geometry | 6+ responsive SVG targeting bracket pins (3 on hero `m4-open`, 1 on each of 3 armor cards) | M3 | R3 Explorer |
| 21 | Reticle Tactical Lock-On Effect | Animated pulsing radar ring and tactical bracket lock animation on hover/focus/active | M3 | R3 Explorer |
| 22 | Spec Tooltip Callout Cards | Expandable spec cards showing real M4 Max technical specifications | M3 | R3 Explorer |
| 23 | Pin Keyboard & ARIA Accessibility | Full `Tab`, `Enter`, `Space`, `Escape` navigation, `aria-expanded`, and live region announcements | M3 | R3 Explorer |
| 24 | Fixed HUD Telemetry Tray | Fixed bottom-right status line: section name, scroll depth %, Gotham local time, audio status | M4 | R4 Explorer |
| 25 | Expandable Diagnostic Batcomputer Panel | Collapsible panel with simulated CPU/GPU oscillation canvas, memory bandwidth stream, active workload sync, and quick-nav | M4 | R4 Explorer |
| 26 | HUD Footer Collision Avoidance | Dynamic `IntersectionObserver` on `.site-footer` lifting tray above footer content | M4 | R4 Explorer |
| 27 | HUD Mobile & Keyboard Accessibility | Safe-area padding, touch target compliance, and `Enter`/`Space`/`Escape` toggling | M4 | R4 Explorer |
| 28 | Programmatic Web Audio Synthesizer | Zero-dependency Web Audio API sound generator (`WayneAudioManager`) | M5 | R5 Explorer |
| 29 | Four Distinct Sound Effects | Mechanical click, diagnostic chirp, sonar sweep, and sub-bass tactical lock | M5 | R5 Explorer |
| 30 | Audio Preference & Muted Default | Default muted on first load, persist in `localStorage['after-dark-audio']`, gesture unlock | M5 | R5 Explorer |
| 31 | Audio OS Reduced-Motion Sync | Automatically disable audio when OS `prefers-reduced-motion: reduce` is detected | M5 | R5 Explorer |
| 32 | Integrated Audio Toggle | Visible UI toggle for sound in telemetry HUD and footer motion toggle extension | M5 | R5 Explorer |
| 33 | E2E Playwright Test Suite Infrastructure | Setup `@playwright/test`, `axe-core`, test runner scripts, and `TEST_INFRA.md` | E2E-T1 | Test Track |
| 34 | Tier 1-4 Verification Tests | Automated tests for axe-core accessibility, pins, telemetry tray, audio toggle, workload URL sync, and visual screenshots | E2E-T1 | Test Track |
| 35 | 100% E2E Pass & Coverage Hardening | Run all E2E tests to 100% passing state and conduct Phase 2 adversarial coverage hardening | Final (M6) | Dual Track |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| **M1** | Codebase Hardening & Web Interface Guidelines | Features 1–11 (Typography `&nbsp;`, curly quotes, Geist Mono preload, tabular-nums, scroll-margin, safe areas, nav overscroll, workload URL sync, pointerglow cache, link specificity, transition audit) | None | COMPLETE |
| **M2** | Scroll Animations, Micro-Interactions & Haptics | Features 12–19 (Multi-tier stagger engine, hero parallax depth, magnetic buttons, stat counters, benchmark bar fills, heading glitch, vibration haptics, reduced-motion) | M1 | COMPLETE |
| **M3** | Interactive Wayne Tech Hardware Inspection Pins | Features 20–23 (6+ SVG reticle pins on hero & armor cards, pulsing rings, lock-on effect, M4 Max spec tooltips, keyboard & ARIA accessibility) | M1 | COMPLETE |
| **M4** | Persistent Collapsible Telemetry HUD Tray | Features 24–27 (Fixed bottom-right HUD, collapsed status line, expanded Batcomputer diagnostic panel, canvas gauges, footer collision avoidance, quick-nav) | M1, M2 | COMPLETE |
| **M5** | High-Fidelity Web Audio Sprite System | Features 28–32 (Web Audio API synthetic sound engine, 4 distinct sound effects, muted default, localStorage persistence, reduced motion sync, UI toggles) | M1 | COMPLETE |
| **E2E-T1** | E2E Testing Track: Harness & Test Suite | Features 33–34 (Playwright configuration, axe-core integration, Tiers 1-4 tests covering all 32 functional features, publish `TEST_READY.md`) | None (Parallel Track) | COMPLETE |
| **M6** | Final Milestone: 100% E2E Pass & Adversarial Hardening | Feature 35 (Phase 1: Pass 100% of E2E test suite across Tiers 1-4; Phase 2: Adversarial coverage hardening via Challenger loop) | M1–M5, E2E-T1 | COMPLETE (36/36 Passing) |

---

## Interface Contracts

### M1 (Hardening) ↔ M2 (Motion)
- `index.html` structure remains intact with existing semantic classes (`.hero__frame`, `.gallery__card`, `.hero__stats`, `.ticker`, `.bars`, `.bench`, `.section__head`).
- M1 injects `&nbsp;` and spans without changing parent element selectors or CSS class names.
- Motion toggle class `.motion-off` on `document.documentElement` remains the canonical global switch for all animations.

### M1 (Hardening) ↔ M3 (Pins)
- Container classes `.hero__frame` and `.gallery__media` maintain `position: relative` and explicit `aspect-ratio` to anchor percentage-based pin coordinates (`top: %`, `left: %`).
- Pins are rendered as `<button class="pin" aria-expanded="false" data-pin-id="...">` inside these containers.

### M1/M2/M5 ↔ M4 (Telemetry Tray)
- Telemetry tray DOM mounts as `<aside id="telemetry-hud" class="hud-tray" aria-label="Wayne Tech System Telemetry">` before `</body>`.
- Footer observation uses `.site-footer` to compute bottom lift offset dynamically.
- Active workload recommendation listens to `workloadInputs` change events or `fit-name` text content.
- Telemetry tray displays audio state (`AUDIO ON` / `AUDIO OFF`) and provides an audio toggle button.

### M1/M4 ↔ M5 (Audio System)
- Global audio manager singleton `window.wayneAudio` exposes:
  - `play(soundName)` where `soundName` $\in$ `['click', 'chirp', 'sweep', 'lock']`
  - `toggle()` $\rightarrow$ boolean (returns new enabled state)
  - `isEnabled()` $\rightarrow$ boolean
  - Emits `CustomEvent('audiostatechange', { detail: { enabled } })` on `window`.
- Telemetry tray and footer controls subscribe to `audiostatechange` to update indicators.
