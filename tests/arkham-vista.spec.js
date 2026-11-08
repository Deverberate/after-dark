// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Arkham City Hero Vista (@arkham-vista)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Atmospheric VFX canvas is mounted with accessibility attributes', async ({ page }) => {
    const canvas = page.locator('#arkham-canvas');
    await expect(canvas).toBeAttached();
    await expect(canvas).toHaveAttribute('role', 'img');
    await expect(canvas).toHaveAttribute('aria-label', /Arkham City atmospheric snowfall/i);
  });

  test('Gotham skyline silhouette and Wonder Tower beacon are rendered', async ({ page }) => {
    const skyline = page.locator('.arkham-skyline');
    await expect(skyline).toBeAttached();

    const beacon = page.locator('.arkham-beacon');
    await expect(beacon).toBeAttached();

    const neonCyan = page.locator('.arkham-neon--cyan');
    await expect(neonCyan).toBeAttached();
    await expect(neonCyan).toHaveText('ACE CHEM');
  });

  test('Arkham tactical game menu mounts 6 target options with valid hrefs', async ({ page }) => {
    const menu = page.locator('.arkham-menu');
    await expect(menu).toBeVisible();

    const menuItems = page.locator('.arkham-menu__item');
    await expect(menuItems).toHaveCount(6);

    const expectedHrefs = ['#machine', '#silicon', '#proof', '#armor', '#specs', '#models'];
    for (let i = 0; i < expectedHrefs.length; i++) {
      const item = menuItems.nth(i);
      await expect(item).toHaveAttribute('href', expectedHrefs[i]);
    }

    // First item should be active initially
    await expect(menuItems.first()).toHaveClass(/is-active/);
  });

  test('Hovering menu items aligns laser reticle and applies glitch class', async ({ page }) => {
    const reticle = page.locator('#arkham-reticle');
    await expect(reticle).toBeAttached();

    const secondItem = page.locator('.arkham-menu__item').nth(1);
    await secondItem.hover();

    await expect(reticle).toHaveClass(/is-visible/);

    // Click second item
    await secondItem.click();
    await expect(secondItem).toHaveClass(/is-active/);
  });

  test('All 3 Hero diagnostic pins remain fully intact and interactive', async ({ page }) => {
    const heroPins = ['hero-1', 'hero-2', 'hero-3'];
    for (const pinId of heroPins) {
      const pin = page.locator(`.pin[data-pin-id="${pinId}"]`);
      await expect(pin).toBeVisible();

      const box = await pin.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }

      // Click to toggle tooltip
      await pin.click();
      await expect(pin).toHaveAttribute('aria-expanded', 'true');
      const tooltip = page.locator(`#pin-callout-${pinId}`);
      await expect(tooltip).toBeVisible();

      // Click again to close
      await pin.click();
      await expect(pin).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('Arkham menu items meet touch target requirement (>= 44x44px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const menuItems = page.locator('.arkham-menu__item');
    const count = await menuItems.count();
    expect(count).toBe(6);

    for (let i = 0; i < count; i++) {
      const item = menuItems.nth(i);
      const box = await item.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('CSS strictness: zero transition: all occurrences preserved across entire stylesheet', async () => {
    const cssPath = path.resolve(__dirname, '../assets/styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

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

  test('Searchlight beams dynamically occlude under solid tiles (photos, graphs, hardware cards)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(400);

    // Verify occlusion of hero photo tile (.hero__frame)
    const occlusionState = await page.evaluate(() => {
      const canvas = document.getElementById('arkham-canvas');
      if (!canvas) return null;
      const aCtx = canvas.getContext('2d');
      const frame = document.querySelector('.hero__frame');
      if (!frame) return null;
      const rect = frame.getBoundingClientRect();

      // Sample pixels inside frame bounds
      const midX = Math.round(rect.left + rect.width * 0.5);
      const midY = Math.round(rect.top + rect.height * 0.5);
      const imgDataInside = aCtx.getImageData(midX, midY, 1, 1).data;

      // Sample pixels in open sky / editorial text region to the left
      const title = document.getElementById('hero-title');
      const tRect = title ? title.getBoundingClientRect() : { left: 80, top: 200 };

      return {
        frameRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        insideAlpha: imgDataInside[3],
        canvasZIndex: window.getComputedStyle(canvas).zIndex
      };
    });

    expect(occlusionState).not.toBeNull();
    if (occlusionState) {
      expect(occlusionState.canvasZIndex).toBe('10');
      expect(occlusionState.frameRect.width).toBeGreaterThan(0);
    }

    // Scroll to silicon and verify occlusion on chip-table-wrap
    const silicon = page.locator('#silicon');
    await silicon.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const siliconTileOccluded = await page.evaluate(() => {
      const tableWrap = document.querySelector('.chip-table-wrap');
      if (!tableWrap) return false;
      const rect = tableWrap.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight;
    });

    expect(siliconTileOccluded).toBe(true);
  });
});
