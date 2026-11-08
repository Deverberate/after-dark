# Original User Request

## Initial Request — 2026-11-07T19:53:06Z

Upgrade an existing static HTML/CSS/JS website — "M4 After Dark," a Batman-themed MacBook Pro M4 Max concept study — into a high-fidelity, award-worthy interactive experience. The site already has a complete structure (hero, machine, silicon, proof, armor, specs, models sections), responsive layout, dark theme (obsidian/ice grey/signal red), custom fonts, a canvas die-map animation, workload selector, and mobile nav. The upgrade must add premium scroll-driven animations, micro-interactions, haptic feedback, interactive hardware inspection pins, a persistent telemetry HUD tray, generated audio sprites, and full Web Interface Guidelines compliance — all at the craft level of a senior motion/graphics designer's portfolio piece.

Working directory: /Users/jonahgeorgenishant/Documents/fvf/Websites/Batman-motiondesign
Integrity mode: development

The existing codebase consists of:
- `index.html` (828 lines) — full page structure with semantic HTML, ARIA, skip links
- `assets/styles.css` (3020 lines) — complete styling with CSS custom properties, responsive breakpoints, print styles, prefers-reduced-motion support
- `assets/main.js` (801 lines) — navigation, motion toggle, reveal observer, workload selector, canvas die-map, print handler
- `assets/fonts/` — Instrument Sans, Instrument Serif Italic, Geist Mono (all self-hosted woff2)
- `assets/images/` — responsive WebP + JPEG fallback sets for hero, closed, keyboard, lid, edge shots

## Requirements

### R1. Codebase Hardening & Web Interface Guidelines Compliance
Fix all issues from the existing audit: inject non-breaking spaces before all units (`2.15&nbsp;kg`, `546&nbsp;GB/s`, `1.68&nbsp;cm`, etc.), convert straight apostrophes to typographic curly quotes, preload the Geist Mono font, add `font-variant-numeric: tabular-nums` on `.chip-table td`, add `scroll-margin-top` on heading/ID targets, apply `env(safe-area-inset-bottom)` padding to `.footer__bottom`, add `overscroll-behavior: contain` to the mobile nav drawer, synchronize the workload radio selector with URL query params via `history.replaceState`, cache hero bounding rect on resize instead of reading layout per pointermove, and use specific link labels (e.g., "Configure M4 at Apple" instead of repeated "See it at Apple"). All existing accessibility features (skip link, ARIA labels, keyboard nav, focus-visible, screen reader text) must be preserved.

### R2. High-Fidelity Scroll Animations, Micro-Interactions & Haptics
Replace the basic reveal (fade+translate) system with a premium, layered scroll-driven animation engine. Every section transition should feel crafted: staggered entry of child elements with eased timing curves, parallax depth on hero imagery, magnetic hover effects on buttons and cards, smooth counter animations on stats/numbers, progress-bar fill animations on benchmark bars that trigger on scroll intersection, and a subtle scanline/glitch effect on section headings as they enter. Add haptic feedback via the Vibration API (where supported) on key interactions: workload selection, inspection pin activation, telemetry tray toggle, and nav menu open/close. All animations must honor `prefers-reduced-motion` and the existing motion toggle. Performance budget: no layout thrashing, compositor-friendly properties only (`transform`, `opacity`), requestAnimationFrame batching, and smooth 60fps on a 2020 MacBook Pro.

### R3. Interactive Wayne Tech Hardware Inspection Pins
Add clickable/hoverable diagnostic reticle pins positioned over the hero image (`m4-open`) and armor gallery images. Each pin is a small animated targeting bracket (SVG crosshair with a pulsing ring) that, on hover/click/keyboard-focus, expands into a tooltip callout card showing a technical spec (e.g., "Liquid Retina XDR · 3456×2234 · 1,600 nits peak HDR" or "Thunderbolt 5 · 120 Gb/s"). Pins must be responsive (reposition correctly on resize), keyboard accessible (Tab + Enter/Space to activate), announced by screen readers, and dismissible with Escape. The reticle brackets should animate with a tactical lock-on effect. Place at least 3 pins on the hero figure and 1 pin on each of the 3 armor gallery figures (6 total minimum).

### R4. Persistent Collapsible Telemetry Tray
Add a fixed-position HUD telemetry tray in the bottom-right corner of the viewport. In its collapsed state, it displays a compact monospace status line: current section name, scroll depth percentage, Gotham local time, and audio status (ON/OFF). On click/keyboard activation, it expands into a small Wayne Applied Sciences diagnostic panel showing: a simulated CPU/GPU utilization gauge (animated sine waves or bar oscillations), memory bandwidth flow visualization, the active workload recommendation, and quick-nav section shortcuts. The tray must not obscure content or interfere with the footer, must respect safe-area insets on mobile, and must be dismissible. It should feel like a real piece of Batcomputer instrumentation — monospace type, thin border lines, subtle scan-line texture, and the signal red accent on active data points only.

### R5. High-Fidelity Audio Sprite System
Create a set of short, high-quality audio effects and integrate them into an audio manager. Required sounds: (1) a crisp mechanical click for button/link interactions, (2) a high-frequency diagnostic chirp for inspection pin reveals, (3) a radar/sonar sweep for section transitions or canvas events, (4) a sub-bass tactical lock confirmation for workload switching. Audio files should be generated programmatically (Web Audio API synthesis) or created as small MP3/WAV sprites in `assets/audio/`. The audio manager must: default to muted on first visit, persist preference in localStorage, respect `prefers-reduced-motion`, integrate with the existing motion toggle button (extend it to "Motion & Sound On/Off" or add a separate audio toggle in the telemetry tray), and never autoplay sound without user activation. All audio interactions should be subtle and feel premium — not gamified.

## Acceptance Criteria

### Visual & Animation Quality
- [ ] Every section transition uses staggered, eased entry animations (not simple fade-in) with at least 3 distinct timing offsets per section
- [ ] Hero image has visible parallax depth effect on scroll
- [ ] Buttons and interactive cards exhibit magnetic/scale hover micro-animations
- [ ] Stat counters animate from 0 to their final value when scrolled into view
- [ ] Benchmark bars animate their fill width on scroll intersection
- [ ] At least one heading per page has a subtle glitch/scanline effect on entry
- [ ] All animations run at 60fps without jank (no forced synchronous layouts in animation frames)

### Inspection Pins
- [ ] At least 6 inspection pins total are rendered (3 on hero, 1 per armor card)
- [ ] Each pin shows a visible animated reticle/crosshair bracket
- [ ] Clicking or focusing a pin reveals a tooltip with real M4 Max specs
- [ ] Pins reposition correctly when the browser window is resized
- [ ] Pins are keyboard navigable (Tab → Enter/Space to open, Escape to close)
- [ ] Tooltip content is announced to screen readers

### Telemetry Tray
- [ ] A fixed HUD element is visible in the bottom-right corner on page load
- [ ] Collapsed state shows at minimum: section name, scroll %, and time
- [ ] Clicking the tray expands it to reveal diagnostic gauges and quick-nav
- [ ] Tray does not overlap or obscure the page footer when scrolled to bottom
- [ ] Tray is keyboard accessible and can be toggled with Enter/Space
- [ ] Tray uses monospace font consistent with the site's Geist Mono

### Audio System
- [ ] Audio defaults to muted on first visit (no sound plays without user action)
- [ ] A visible toggle exists to enable/disable audio
- [ ] At least 4 distinct sound effects play on appropriate interactions when audio is enabled
- [ ] Audio preference persists across page reloads via localStorage
- [ ] Enabling `prefers-reduced-motion` at the OS level disables audio

### Accessibility & Guidelines Compliance
- [ ] All images have descriptive `alt` text and explicit `width`/`height`
- [ ] All interactive elements have visible `:focus-visible` styles
- [ ] Skip link works and lands on `#main`
- [ ] No `transition: all` anywhere in the stylesheet
- [ ] Non-breaking spaces separate all numerals from their units
- [ ] Workload selector state is reflected in the URL query string
- [ ] Mobile nav drawer has `overscroll-behavior: contain`
- [ ] Footer has `safe-area-inset-bottom` padding
- [ ] All animations disabled when `prefers-reduced-motion: reduce` is active and motion toggle is off

### Verification
A Playwright test script (`tests/verify.spec.js`) must be included that:
- [ ] Loads the page and checks for zero axe-core accessibility violations (critical/serious)
- [ ] Verifies all 6+ inspection pins are present and clickable
- [ ] Confirms the telemetry tray toggles between collapsed and expanded states
- [ ] Checks that the audio toggle exists and can be activated
- [ ] Screenshots each major section for visual regression review
- [ ] Confirms no `transition: all` exists in the compiled CSS
- [ ] Verifies the workload selector updates the URL query param
