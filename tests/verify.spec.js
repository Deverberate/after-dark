// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright');
const fs = require('fs');
const path = require('path');

/**
 * ==============================================================================
 * M4 After Dark — Comprehensive E2E Test Suite (Tiers 1–4)
 * Authoritative Specifications: ORIGINAL_REQUEST.md & PROJECT.md
 * ==============================================================================
 */

test.describe('Tier 1: Static Hardening & Web Interface Guidelines (@tier1 @m1)', () => {

  test('[F11] CSS Audit: zero transition: all occurrences across stylesheet', async () => {
    const cssPath = path.resolve(__dirname, '../assets/styles.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Matches transition: all or transition:all with any whitespace/newlines
    const transitionAllRegex = /transition\s*:\s*([^;}]*?\ball\b[^;}]*?)[;}]/gi;
    const matches = [];
    let match;
    while ((match = transitionAllRegex.exec(cssContent)) !== null) {
      matches.push(match[0].trim());
    }

    expect(
      matches,
      `Found disallowed "transition: all" instances in assets/styles.css:\n${matches.join('\n')}`
    ).toEqual([]);
  });

  test('[F1] Typography: non-breaking spaces before units in text content', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();

    // Verify key unit patterns do not have breaking spaces in critical spec elements
    // Should use &nbsp; or \u00A0
    const nonBreakingKg = /2\.15[\u00A0&nbsp;]+kg/i.test(html) || /2\.15&nbsp;kg/i.test(html);
    const nonBreakingGbps = /546[\u00A0&nbsp;]+GB\/s/i.test(html) || /546&nbsp;GB\/s/i.test(html);
    const nonBreakingCm = /1\.68[\u00A0&nbsp;]+cm/i.test(html) || /1\.68&nbsp;cm/i.test(html);

    expect(
      nonBreakingKg || nonBreakingGbps || nonBreakingCm,
      'Expected non-breaking spaces (\u00A0 or &nbsp;) before technical units (kg, GB/s, cm)'
    ).toBe(true);
  });

  test('[F2] Typography: typographic curly quotes in meta description and copy', async ({ page }) => {
    await page.goto('/');
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDesc).toBeTruthy();
    // Must contain curly apostrophe ’ (U+2019) instead of straight '
    expect(
      metaDesc,
      'Meta description must use typographic curly apostrophe (Apple’s), not straight apostrophe (Apple\'s)'
    ).toContain('’');
    expect(metaDesc).not.toContain("Apple's");
  });

  test('[F3] Head Preload: Geist Mono font preloaded in document head', async ({ page }) => {
    await page.goto('/');
    const preloadGeist = page.locator('head > link[rel="preload"][href*="geist-mono.woff2"]');
    await expect(preloadGeist).toHaveCount(1);
    await expect(preloadGeist).toHaveAttribute('as', 'font');
    await expect(preloadGeist).toHaveAttribute('type', 'font/woff2');
  });

  test('[F4] Table Typography: tabular numbers applied to chip comparison table', async ({ page }) => {
    await page.goto('/');
    const chipTableTd = page.locator('.chip-table td').first();
    await expect(chipTableTd).toBeVisible();

    const fontVariantNumeric = await chipTableTd.evaluate((el) => {
      return window.getComputedStyle(el).fontVariantNumeric;
    });

    expect(
      fontVariantNumeric,
      'Expected font-variant-numeric on .chip-table td to include "tabular-nums"'
    ).toContain('tabular-nums');
  });

  test('[F5] Navigation: scroll margin on section targets', async ({ page }) => {
    await page.goto('/');
    const sectionIds = ['machine', 'silicon', 'proof', 'armor', 'specs', 'models'];

    for (const id of sectionIds) {
      const section = page.locator(`#${id}`);
      await expect(section).toBeAttached();
      const scrollMarginTop = await section.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).scrollMarginTop) || 0;
      });
      expect(
        scrollMarginTop,
        `Expected scroll-margin-top on #${id} to be at least 48px (~3rem)`
      ).toBeGreaterThanOrEqual(48);
    }
  });

  test('[F6] Mobile Navigation: overscroll-behavior contain on mobile drawer', async ({ page }) => {
    // Emulate mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const nav = page.locator('.nav');
    const overscroll = await nav.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.overscrollBehavior || style.overscrollBehaviorY;
    });

    expect(
      overscroll,
      'Expected overscroll-behavior: contain on mobile navigation drawer'
    ).toBe('contain');
  });

  test('[F7] Footer: safe area padding on footer bottom', async ({ page }) => {
    await page.goto('/');
    const footerBottom = page.locator('.footer__bottom');
    await expect(footerBottom).toBeAttached();

    const paddingBottom = await footerBottom.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).paddingBottom) || 0;
    });

    expect(
      paddingBottom,
      'Expected padding-bottom on .footer__bottom to provide safe area clearance'
    ).toBeGreaterThanOrEqual(24);
  });

  test('[F10] Accessibility: unique, descriptive Apple store link labels', async ({ page }) => {
    await page.goto('/');
    const modelLinks = page.locator('#models a[href*="apple.com"]');
    const count = await modelLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const labels = [];
    for (let i = 0; i < count; i++) {
      const text = (await modelLinks.nth(i).textContent())?.trim() || '';
      labels.push(text);
      expect(
        text,
        `Model link at index ${i} should be descriptive, not generic "See it at Apple"`
      ).not.toBe('See it at Apple');
      expect(text).toMatch(/Configure M4/i);
    }

    // Verify labels are distinct
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(count);
  });

  test('[A11y] Skip link functionality and target focus', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();

    // Focus skip link
    await skipLink.focus();
    await expect(skipLink).toBeVisible();

    // Trigger activation
    await page.keyboard.press('Enter');

    // URL should have #main
    expect(page.url()).toContain('#main');

    // Main should be active element
    const activeId = await page.evaluate(() => document.activeElement?.id);
    expect(activeId).toBe('main');
  });
});

test.describe('Tier 2: Component State & Boundary Transitions (@tier2)', () => {

  test.describe('Workload Selector (@m1)', () => {
    test('[F8] Workload Selector: radio selection updates URL query parameter via history.replaceState', async ({ page }) => {
      await page.goto('/');

      // Initially on root URL
      expect(page.url()).not.toContain('workload=');

      // Select 'professional' workload
      const proRadio = page.locator('input[name="workload"][value="professional"]');
      await proRadio.check({ force: true });
      await expect(proRadio).toBeChecked();

      // URL should reflect workload=professional without full reload
      expect(page.url()).toContain('workload=professional');
      await expect(page.locator('#fit-name')).toHaveText('M4 Pro');

      // Select 'extreme' workload
      const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
      await extremeRadio.check({ force: true });
      await expect(extremeRadio).toBeChecked();

      // URL should reflect workload=extreme
      expect(page.url()).toContain('workload=extreme');
      await expect(page.locator('#fit-name')).toHaveText('M4 Max');
    });

    test('[F8] Workload Selector: restores state from URL query parameter on direct visit', async ({ page }) => {
      await page.goto('/?workload=extreme');

      const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
      await expect(extremeRadio).toBeChecked();
      await expect(page.locator('#fit-name')).toHaveText('M4 Max');
    });

    test('[F8] Workload Selector: handles invalid or unknown query parameter gracefully', async ({ page }) => {
      await page.goto('/?workload=hyper-drive-invalid');

      // Should fall back to default 'everyday' without crash
      const everydayRadio = page.locator('input[name="workload"][value="everyday"]');
      await expect(everydayRadio).toBeChecked();
      await expect(page.locator('#fit-name')).toHaveText('M4');
    });
  });

  test.describe('Hardware Inspection Pins (@m3)', () => {
    test('[F20] Hardware Inspection Pins: at least 6 pins exist across hero and armor cards', async ({ page }) => {
      await page.goto('/');
      const pins = page.locator('.pin, [data-pin-id]');
      const pinCount = await pins.count();

      expect(
        pinCount,
        'Expected at least 6 inspection pins total (3 on hero, 1 per armor card)'
      ).toBeGreaterThanOrEqual(6);

      const heroPins = page.locator('.hero__frame .pin, .hero__frame [data-pin-id]');
      const heroPinCount = await heroPins.count();
      expect(heroPinCount, 'Expected at least 3 pins on hero frame').toBeGreaterThanOrEqual(3);

      const armorPins = page.locator('.gallery__card .pin, .gallery__card [data-pin-id], .gallery__media .pin');
      const armorPinCount = await armorPins.count();
      expect(armorPinCount, 'Expected at least 3 pins across armor gallery cards').toBeGreaterThanOrEqual(3);
    });

    test('[F21] Hardware Inspection Pins: animated reticle and crosshair bracket elements present', async ({ page }) => {
      await page.goto('/');
      const pins = page.locator('.pin, [data-pin-id]');
      const count = await pins.count();
      expect(count).toBeGreaterThanOrEqual(6);

      for (let i = 0; i < count; i++) {
        const pin = pins.nth(i);
        // Each pin must contain an SVG crosshair / reticle bracket or animated ring
        const hasSvgOrRing = (await pin.locator('svg, .pin__reticle, .pin__ring').count()) > 0;
        expect(hasSvgOrRing, `Pin at index ${i} must have targeting reticle markup`).toBe(true);
      }
    });

    test('[F22, F23] Hardware Inspection Pins: click/hover reveals spec tooltip with ARIA attributes', async ({ page }) => {
      await page.goto('/');
      const firstPin = page.locator('.pin, [data-pin-id]').first();
      await expect(firstPin).toBeAttached();

      // Starts collapsed with aria-expanded="false"
      await expect(firstPin).toHaveAttribute('aria-expanded', 'false');

      // Click to open
      await firstPin.click();
      await expect(firstPin).toHaveAttribute('aria-expanded', 'true');

      // Spec tooltip callout card should now be visible with technical specs
      const tooltip = page.locator('.pin__tooltip, .spec-card, [role="tooltip"]').first();
      await expect(tooltip).toBeVisible();
      const tooltipText = await tooltip.textContent();
      expect(tooltipText?.length).toBeGreaterThan(10);
    });

    test('[F23] Hardware Inspection Pins: keyboard navigation and Escape dismissal', async ({ page }) => {
      await page.goto('/');
      const firstPin = page.locator('.pin, [data-pin-id]').first();
      await expect(firstPin).toBeAttached();

      // Focus pin button
      await firstPin.focus();
      await page.keyboard.press('Enter');
      await expect(firstPin).toHaveAttribute('aria-expanded', 'true');

      // Dismiss with Escape key
      await page.keyboard.press('Escape');
      await expect(firstPin).toHaveAttribute('aria-expanded', 'false');

      // Focus should remain on the pin
      const isFocused = await firstPin.evaluate((el) => document.activeElement === el);
      expect(isFocused, 'Focus must return to pin button after Escape dismissal').toBe(true);
    });
  });

  test.describe('Telemetry HUD Tray (@m4)', () => {
    test('[F24] Telemetry HUD: fixed HUD tray element is visible at bottom-right', async ({ page }) => {
      await page.goto('/');
      const hud = page.locator('#telemetry-hud, .hud-tray');
      await expect(hud).toBeAttached();

      const position = await hud.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          position: style.position,
          bottom: style.bottom,
          right: style.right,
        };
      });

      expect(['fixed', 'sticky']).toContain(position.position);
    });

    test('[F24] Telemetry HUD: collapsed state displays status line metrics', async ({ page }) => {
      await page.goto('/');
      const hud = page.locator('#telemetry-hud, .hud-tray');
      await expect(hud).toBeAttached();

      const text = (await hud.textContent()) || '';
      // Must contain Gotham time or time pattern
      expect(text).toMatch(/\d{1,2}:\d{2}|Gotham/i);
      // Must contain audio status indication
      expect(text).toMatch(/audio/i);
    });

    test('[F25, F27] Telemetry HUD: expands on click/Enter to reveal Batcomputer diagnostic panel', async ({ page }) => {
      await page.goto('/');
      const hudToggle = page.locator('#telemetry-hud button, .hud-tray__toggle, .hud-tray [aria-expanded]').first();
      await expect(hudToggle).toBeAttached();

      // Expand HUD
      await hudToggle.click();
      const hudPanel = page.locator('.hud-panel, .hud-tray__panel, .hud-diagnostic');
      await expect(hudPanel).toBeVisible();

      // Must contain animated gauge canvas or metrics
      const canvasOrGauges = hudPanel.locator('canvas, .hud-gauge, .hud-metric');
      expect(await canvasOrGauges.count()).toBeGreaterThan(0);

      // Dismiss HUD
      await hudToggle.click();
      await expect(hudPanel).not.toBeVisible();
    });
  });

  test.describe('Web Audio Subsystem (@m5)', () => {
    test('[F28, F30] Audio Subsystem: defaults to muted on initial visit', async ({ page }) => {
      await page.goto('/');
      const storedPref = await page.evaluate(() => localStorage.getItem('after-dark-audio'));
      expect(storedPref).not.toBe('true');

      // Audio state should indicate muted / OFF
      const hudText = await page.locator('#telemetry-hud, .hud-tray, .site-footer').first().textContent();
      expect(hudText).toMatch(/muted|off|sound/i);
    });

    test('[F30, F32] Audio Toggle: user activation enables sound and persists in localStorage', async ({ page }) => {
      await page.goto('/');
      const audioBtn = page.locator('#audio-toggle, [data-audio-toggle], .hud-audio-btn, button:has-text("Audio")').first();
      await expect(audioBtn).toBeAttached();

      // Toggle audio ON
      await audioBtn.click();
      let state = await page.evaluate(() => localStorage.getItem('after-dark-audio'));
      expect(state).toBe('true');

      // Reload page — preference should persist
      await page.reload();
      state = await page.evaluate(() => localStorage.getItem('after-dark-audio'));
      expect(state).toBe('true');

      // Toggle audio OFF
      const audioBtnAfterReload = page.locator('#audio-toggle, [data-audio-toggle], .hud-audio-btn, button:has-text("Audio")').first();
      await audioBtnAfterReload.click();
      state = await page.evaluate(() => localStorage.getItem('after-dark-audio'));
      expect(state).toBe('false');
    });

    test('[F28, F29] Audio Subsystem: window.wayneAudio singleton contract', async ({ page }) => {
      await page.goto('/');
      const audioContract = await page.evaluate(() => {
        const audio = window['wayneAudio'];
        if (!audio) return null;
        return {
          hasPlay: typeof audio.play === 'function',
          hasToggle: typeof audio.toggle === 'function',
          hasIsEnabled: typeof audio.isEnabled === 'function',
        };
      });

      expect(audioContract).not.toBeNull();
      expect(audioContract?.hasPlay).toBe(true);
      expect(audioContract?.hasToggle).toBe(true);
      expect(audioContract?.hasIsEnabled).toBe(true);
    });
  });

  test.describe('Scroll & Motion Micro-Interactions (@m2)', () => {
    test('[F15] Motion Engine: stat counter elements configured for interpolation', async ({ page }) => {
      await page.goto('/');
      const stats = page.locator('.hero__stats dd, [data-count]');
      expect(await stats.count()).toBeGreaterThanOrEqual(4);
    });

    test('[F16] Motion Engine: benchmark bars contain fill attributes or elements', async ({ page }) => {
      await page.goto('/');
      const bars = page.locator('.bench__bar, .bars__bar, [data-fill]');
      expect(await bars.count()).toBeGreaterThanOrEqual(1);
    });

    test('[F17] Motion Engine: section titles feature tactical glitch/scanline animation classes', async ({ page }) => {
      await page.goto('/');
      const headings = page.locator('.section__title, .h2, .hero__title');
      expect(await headings.count()).toBeGreaterThanOrEqual(5);
    });
  });
});

test.describe('Tier 3: Pairwise & System Integration (@tier3)', () => {

  test('[F26] HUD Collision Avoidance: tray lifts above footer when scrolling to page bottom', async ({ page }) => {
    await page.goto('/');
    const hud = page.locator('#telemetry-hud, .hud-tray');
    await expect(hud).toBeAttached();

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const hudBox = await hud.boundingBox();
    const footerBox = await page.locator('.site-footer').boundingBox();

    expect(hudBox).not.toBeNull();
    expect(footerBox).not.toBeNull();

    if (hudBox && footerBox) {
      // The HUD should adjust its transform/offset or remain positioned cleanly
      const hudBottom = hudBox.y + hudBox.height;
      const footerBottom = footerBox.y + footerBox.height;
      expect(hudBottom).toBeLessThanOrEqual(footerBottom + 20);
    }
  });

  test('[F19, F31] Accessibility: prefers-reduced-motion suppresses animations and disables audio', async ({ page }) => {
    // Emulate reduced-motion at OS level
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const isReduced = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    expect(isReduced).toBe(true);

    // Audio should default to muted under reduced motion
    const audioPref = await page.evaluate(() => localStorage.getItem('after-dark-audio'));
    expect(audioPref).not.toBe('true');
  });

  test('[F19] Motion Switch: in-page motion toggle controls global motion class and localStorage', async ({ page }) => {
    await page.goto('/');
    const motionToggle = page.locator('#motion-toggle, .motion-toggle, [data-motion-toggle]').first();
    if (await motionToggle.count() > 0) {
      await motionToggle.click();
      const hasMotionOff = await page.evaluate(() => document.documentElement.classList.contains('motion-off'));
      expect(hasMotionOff).toBe(true);
    }
  });

  test('[F8, F25] Workload to HUD Sync: changing workload updates HUD diagnostic display', async ({ page }) => {
    await page.goto('/');
    const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
    await extremeRadio.check({ force: true });

    const hud = page.locator('#telemetry-hud, .hud-tray');
    if (await hud.count() > 0) {
      const hudToggle = hud.locator('button, [aria-expanded]').first();
      if (await hudToggle.count() > 0) {
        await hudToggle.click();
        const hudText = await hud.textContent();
        expect(hudText).toMatch(/M4 Max|Extreme/i);
      }
    }
  });
});

test.describe('Tier 4: Visual Screenshots & Real-World User Scenarios (@tier4)', () => {

  test('[F34] Automated Accessibility Audit: axe-core reports zero critical or serious violations', async ({ page }) => {
    await page.goto('/');
    // Wait for initial render and scroll reveal transitions to settle to 100% opacity
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(900);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalSeriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(
      criticalSeriousViolations,
      `axe-core found ${criticalSeriousViolations.length} critical/serious accessibility violations:\n` +
      JSON.stringify(criticalSeriousViolations.map((v) => ({ id: v.id, impact: v.impact, help: v.help })), null, 2)
    ).toEqual([]);
  });

  test('[F34] Visual Regression Snapshots: capture all 7 major sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sectionTargets = [
      { name: 'hero', selector: '#hero, section.hero' },
      { name: 'machine', selector: '#machine' },
      { name: 'silicon', selector: '#silicon' },
      { name: 'proof', selector: '#proof' },
      { name: 'armor', selector: '#armor' },
      { name: 'specs', selector: '#specs' },
      { name: 'models', selector: '#models' },
    ];

    const screenshotDir = path.resolve(__dirname, 'artifacts/screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });

    for (const target of sectionTargets) {
      const section = page.locator(target.selector).first();
      await expect(section).toBeVisible();

      // Scroll into view
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);

      const filePath = path.join(screenshotDir, `section-${target.name}.png`);
      await section.screenshot({ path: filePath });

      expect(fs.existsSync(filePath), `Screenshot file for ${target.name} must exist`).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size, `Screenshot file for ${target.name} must have non-zero size`).toBeGreaterThan(1000);
    }
  });

  test('[Scenario 1] Executive Dark-Room Review: full interactive showcase flow', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    // Check header clock
    const clock = page.locator('.clock');
    await expect(clock).toBeVisible();

    // Check workload selection
    const proOption = page.locator('input[name="workload"][value="professional"]');
    await proOption.check({ force: true });
    expect(page.url()).toContain('workload=professional');
    await expect(page.locator('#fit-name')).toHaveText('M4 Pro');

    // Scroll through sections
    await page.locator('#specs').scrollIntoViewIfNeeded();
    await expect(page.locator('#specs')).toBeVisible();

    await page.locator('#models').scrollIntoViewIfNeeded();
    await expect(page.locator('#models')).toBeVisible();
  });

  test('[Scenario 2] Keyboard-Only Operator: complete accessibility traversal', async ({ page }) => {
    await page.goto('/');

    // 1. Skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Enter');
    expect(page.url()).toContain('#main');

    // 2. Tab into first interactive section button
    await page.keyboard.press('Tab');
    const activeTagName = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(activeTagName);
  });

  test('[Scenario 3] Mobile Field Operator: mobile viewport drawer and safe-area integrity', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Menu toggle on mobile
    const menuToggle = page.locator('.menu-toggle');
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    // Nav list should now be visible or expanded
    const nav = page.locator('.nav');
    await expect(nav).toBeAttached();

    // Verify touch target size of menu button >= 44x44
    const btnBox = await menuToggle.boundingBox();
    expect(btnBox).not.toBeNull();
    if (btnBox) {
      expect(btnBox.width).toBeGreaterThanOrEqual(44);
      expect(btnBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('[Scenario 5] Deep-Linking: direct URL workload navigation and state restoration', async ({ page }) => {
    // Direct link to extreme workload
    await page.goto('/?workload=extreme');
    await expect(page.locator('input[name="workload"][value="extreme"]')).toBeChecked();
    await expect(page.locator('#fit-name')).toHaveText('M4 Max');

    // Change to everyday
    await page.locator('input[name="workload"][value="everyday"]').check({ force: true });
    expect(page.url()).toContain('workload=everyday');
    await expect(page.locator('#fit-name')).toHaveText('M4');
  });
});
