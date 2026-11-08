// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright');

/**
 * Adversarial Accessibility & Responsive Layout Stress-Test Suite
 * Focus areas:
 * 1. Axe-core audits across 4 viewports (Desktop 1440x900, Tablet 768x1024, Mobile 375x667, Mobile 390x844)
 * 2. Narrow viewport 320px horizontal overflow stress test (scrollWidth <= clientWidth)
 * 3. Skip link focus target (#main) and keyboard continuation tab-sequence
 * 4. Mobile touch targets (>= 44x44px bounding box / spacing) on mobile viewports
 */


const VIEWPORTS = [
  { name: 'Desktop (1440x900)', width: 1440, height: 900 },
  { name: 'Tablet (768x1024)', width: 768, height: 1024 },
  { name: 'Mobile SE (375x667)', width: 375, height: 667 },
  { name: 'Mobile Modern (390x844)', width: 390, height: 844 },
];

test.describe('Adversarial Verification: Axe-Core Audits Across Viewports', () => {
  for (const vp of VIEWPORTS) {
    test(`axe-core audit on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      const scanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalSerious = scanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      console.log(`[Axe Summary for ${vp.name}]: ${criticalSerious.length} critical/serious violations found.`);
      if (criticalSerious.length > 0) {
        console.log(`[Violations Detail]:`, JSON.stringify(
          criticalSerious.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.map((n) => ({ html: n.html, target: n.target })),
          })),
          null,
          2
        ));
      }

      expect(
        criticalSerious,
        `Expected zero critical or serious axe violations on ${vp.name}, found ${criticalSerious.length}`
      ).toEqual([]);
    });
  }
});

test.describe('Adversarial Verification: Narrow Viewport (320px) Overflow', () => {
  test('Assert no horizontal scrollbar or element overflow (scrollWidth <= clientWidth) at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const overflowInfo = await page.evaluate(() => {
      const docEl = document.documentElement;
      const body = document.body;
      const clientWidth = docEl.clientWidth;
      const scrollWidth = docEl.scrollWidth;
      const bodyScrollWidth = body.scrollWidth;
      const windowWidth = window.innerWidth;

      return {
        clientWidth,
        scrollWidth,
        bodyScrollWidth,
        windowWidth,
        hasHorizontalScrollbar: scrollWidth > clientWidth,
      };
    });

    console.log('[320px Viewport Metrics]:', JSON.stringify(overflowInfo, null, 2));

    expect(
      overflowInfo.scrollWidth,
      `Horizontal scrollbar detected at 320px: scrollWidth (${overflowInfo.scrollWidth}) > clientWidth (${overflowInfo.clientWidth})`
    ).toBeLessThanOrEqual(overflowInfo.clientWidth);

    expect(overflowInfo.hasHorizontalScrollbar).toBe(false);
  });
});

test.describe('Adversarial Verification: Skip Link Keyboard Navigation & Continuation', () => {
  test('Skip link activates, focuses #main, and allows keyboard continuation into #main content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();

    // 1. Initial keyboard focus onto skip link
    await page.keyboard.press('Tab');
    const focusedClass = await page.evaluate(() => document.activeElement?.className);
    expect(focusedClass).toContain('skip-link');
    await expect(skipLink).toBeVisible();

    // 2. Press Enter to activate skip link
    await page.keyboard.press('Enter');

    // URL should have #main
    expect(page.url()).toContain('#main');

    // Active element must be #main
    const activeElementId = await page.evaluate(() => document.activeElement?.id);
    expect(activeElementId, 'Active element must be #main').toBe('main');

    // 3. Keyboard continuation: Press Tab from #main
    await page.keyboard.press('Tab');

    const continuationTarget = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const main = document.getElementById('main');
      return {
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        href: el.getAttribute('href'),
        isInsideMain: main ? main.contains(el) : false,
      };
    });

    console.log('[Skip Link Continuation Target]:', JSON.stringify(continuationTarget, null, 2));

    expect(
      continuationTarget?.isInsideMain,
      `Expected keyboard Tab after skip link to continue inside #main, but focused: ${JSON.stringify(continuationTarget)}`
    ).toBe(true);
  });
});

test.describe('Adversarial Verification: Mobile Touch Targets (>= 44x44px)', () => {
  for (const vp of [{ name: '375x667', width: 375, height: 667 }, { name: '390x844', width: 390, height: 844 }]) {
    test(`Verify interactive controls meet >= 44x44px bounding box or adequate spacing on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      const targetAudit = await page.evaluate(() => {
        const selectors = [
          'a[href]',
          'button',
          'input',
          'select',
          'textarea',
          '[role="button"]',
          '[tabindex="0"]',
        ];

        const elements = Array.from(document.querySelectorAll(selectors.join(',')));
        const results = [];

        for (const el of elements) {
          const style = window.getComputedStyle(el);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            parseFloat(style.opacity) === 0 ||
            (el.offsetParent === null && style.position !== 'fixed')
          ) {
            continue;
          }

          if (el.classList.contains('skip-link') && el !== document.activeElement) {
            continue;
          }

          const closestNav = el.closest('.nav');
          if (closestNav) {
            const navStyle = window.getComputedStyle(closestNav);
            if (navStyle.display === 'none' || navStyle.visibility === 'hidden' || closestNav.getAttribute('aria-hidden') === 'true') {
              continue;
            }
          }

          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;

          const meets44 = rect.width >= 43.5 && rect.height >= 43.5;

          results.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || undefined,
            className: el.className ? String(el.className).slice(0, 50) : undefined,
            text: (el.textContent?.slice(0, 30).trim() || el.getAttribute('aria-label') || '').replace(/\s+/g, ' '),
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            meets44,
          });
        }

        const undersized = results.filter((r) => !r.meets44);
        return {
          totalInteractive: results.length,
          undersizedCount: undersized.length,
          undersized,
        };
      });

      console.log(`[Touch Targets Audit on ${vp.name}]:`, JSON.stringify(targetAudit, null, 2));

      expect(
        targetAudit.undersizedCount,
        `Found ${targetAudit.undersizedCount} controls smaller than 44x44px on ${vp.name}:\n` +
        JSON.stringify(targetAudit.undersized, null, 2)
      ).toBe(0);
    });
  }
});
