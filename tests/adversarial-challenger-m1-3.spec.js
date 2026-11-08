// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright');

/**
 * Challenger M1-3 Adversarial Stress Test Suite: Milestone 1 Remediation Verification
 *
 * 1. Axe-core on ultra-narrow 320px viewport
 * 2. Keyboard scrollability of .chip-table-wrap at sub-760px viewports
 * 3. Mobile Nav Drawer open state: axe-core + touch target sizes + Escape dismiss
 * 4. Explicit 44x44px bounding box verification of all 6 .pin buttons on mobile
 * 5. Focus ring styling on .chip-table-wrap
 */

test.describe('Challenger M1-3: Ultra-Narrow 320px Axe-Core Audit', () => {
  test('axe-core reports 0 critical/serious violations on 320x568', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const scanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalSerious = scanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    console.log(`[320px Axe Audit]: ${criticalSerious.length} critical/serious violations.`);
    expect(criticalSerious).toEqual([]);
  });
});

test.describe('Challenger M1-3: Keyboard Scrollability of .chip-table-wrap', () => {
  test('Keyboard focus lands on .chip-table-wrap and allows horizontal scrolling on mobile/tablet', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const tableWrap = page.locator('.chip-table-wrap');
    await expect(tableWrap).toBeVisible();

    // Verify attributes
    await expect(tableWrap).toHaveAttribute('tabindex', '0');
    await expect(tableWrap).toHaveAttribute('role', 'region');
    await expect(tableWrap).toHaveAttribute('aria-label', /comparison table/i);

    // Verify focusable and scrollable
    const scrollMetricsBefore = await tableWrap.evaluate((el) => {
      el.focus();
      return {
        isFocused: document.activeElement === el,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollLeft: el.scrollLeft,
        isScrollable: el.scrollWidth > el.clientWidth,
      };
    });

    expect(scrollMetricsBefore.isFocused).toBe(true);
    expect(scrollMetricsBefore.isScrollable).toBe(true);
    expect(scrollMetricsBefore.scrollLeft).toBe(0);

    // Verify focus-visible outline is rendered
    const focusStyle = await tableWrap.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outlineStyle: style.outlineStyle,
        outlineColor: style.outlineColor,
        outlineWidth: style.outlineWidth,
      };
    });

    console.log('[.chip-table-wrap Focus Ring]:', JSON.stringify(focusStyle));
    expect(focusStyle.outlineStyle).toBe('solid');
    expect(focusStyle.outlineColor).toContain('rgb');
  });
});

test.describe('Challenger M1-3: Mobile Nav Drawer State Adversarial Audit', () => {
  test('Mobile drawer open state has 0 axe-core violations and all controls >= 44x44px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const menuToggle = page.locator('#menu-toggle');
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();
    await page.waitForTimeout(300);

    const isNavOpen = await page.evaluate(() => document.documentElement.classList.contains('nav-open'));
    expect(isNavOpen).toBe(true);

    // Run axe-core on open drawer
    const scanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalSerious = scanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalSerious).toEqual([]);

    // Check touch targets in open nav drawer
    const navTargets = await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll('.nav a, .nav button, #menu-toggle'));
      const results = [];
      for (const el of navLinks) {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = el.getBoundingClientRect();
        results.push({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim(),
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
          meets44: rect.width >= 43.5 && rect.height >= 43.5,
        });
      }
      return results;
    });

    console.log('[Open Nav Drawer Targets]:', JSON.stringify(navTargets, null, 2));
    const undersizedNav = navTargets.filter((t) => !t.meets44);
    expect(undersizedNav.length, `Undersized nav links found: ${JSON.stringify(undersizedNav)}`).toBe(0);

    // Press Escape to verify close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const isOpenAfterEsc = await page.evaluate(() => document.documentElement.classList.contains('nav-open'));
    expect(isOpenAfterEsc).toBe(false);
  });
});

test.describe('Challenger M1-3: Hardware Inspection Pins Mobile Dimensions', () => {
  test('All 6 .pin buttons strictly measure >= 44x44px bounding box on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const pinMetrics = await page.evaluate(() => {
      const pins = Array.from(document.querySelectorAll('button.pin'));
      return pins.map((p, idx) => {
        const rect = p.getBoundingClientRect();
        return {
          index: idx,
          pinId: p.getAttribute('data-pin-id'),
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
          meets44: rect.width >= 43.5 && rect.height >= 43.5,
        };
      });
    });

    console.log('[All 6 Pins Mobile Dimensions]:', JSON.stringify(pinMetrics, null, 2));
    expect(pinMetrics.length).toBeGreaterThanOrEqual(6);
    for (const p of pinMetrics) {
      expect(p.meets44, `Pin ${p.index} (${p.pinId}) is smaller than 44x44: ${p.width}x${p.height}`).toBe(true);
    }
  });
});
