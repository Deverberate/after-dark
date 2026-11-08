// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Wayne Soundstage Acoustic Terminal (@soundtrack)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Trigger tab is mounted on right edge with accessibility attributes', async ({ page }) => {
    const trigger = page.locator('#soundtrack-trigger');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-controls', 'soundtrack-drawer');
    await expect(trigger).toHaveAttribute('type', 'button');

    const triggerBox = await trigger.boundingBox();
    expect(triggerBox).not.toBeNull();
    if (triggerBox) {
      expect(triggerBox.width).toBeGreaterThanOrEqual(44);
      expect(triggerBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Clicking trigger tab opens drawer with backdrop and updates ARIA', async ({ page }) => {
    const trigger = page.locator('#soundtrack-trigger');
    const drawer = page.locator('#soundtrack-drawer');
    const backdrop = page.locator('#soundtrack-backdrop');
    const closeBtn = page.locator('#soundtrack-close');

    await trigger.click();
    await expect(drawer).toHaveClass(/is-open/);
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(backdrop).toHaveClass(/is-open/);

    // Close button should receive focus
    await expect(closeBtn).toBeFocused();
  });

  test('Drawer can be closed via close button, backdrop, or Escape key', async ({ page }) => {
    const trigger = page.locator('#soundtrack-trigger');
    const drawer = page.locator('#soundtrack-drawer');
    const closeBtn = page.locator('#soundtrack-close');

    // Open drawer
    await trigger.click();
    await expect(drawer).toHaveClass(/is-open/);

    // Close via close button
    await closeBtn.click();
    await expect(drawer).not.toHaveClass(/is-open/);
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    // Reopen and close with Escape
    await trigger.click();
    await expect(drawer).toHaveClass(/is-open/);
    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/is-open/);
    await expect(trigger).toBeFocused();
  });

  test('Tactical 32-ch visualizer canvas is mounted with valid dimensions and ARIA', async ({ page }) => {
    const canvas = page.locator('#soundtrack-canvas');
    await expect(canvas).toBeAttached();
    await expect(canvas).toHaveAttribute('role', 'img');
    await expect(canvas).toHaveAttribute('aria-label', /visualizer/i);
    await expect(canvas).toHaveAttribute('width', '340');
    await expect(canvas).toHaveAttribute('height', '88');
  });

  test('Transport controls allow playback toggle and prev/next track navigation', async ({ page }) => {
    const trigger = page.locator('#soundtrack-trigger');
    await trigger.click();

    const playBtn = page.locator('#soundtrack-play');
    const prevBtn = page.locator('#soundtrack-prev');
    const nextBtn = page.locator('#soundtrack-next');
    const titleEl = page.locator('#soundtrack-current-title');

    await expect(playBtn).toBeVisible();
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
    await expect(titleEl).toHaveText('Arkham City Main Theme');

    // Click Next to advance track
    await nextBtn.click();
    await expect(titleEl).toHaveText('A Beautiful Lie');

    // Click Next again
    await nextBtn.click();
    await expect(titleEl).toHaveText('The Batman Theme');

    // Click Prev
    await prevBtn.click();
    await expect(titleEl).toHaveText('A Beautiful Lie');
  });

  test('Radio cards update active selection on direct click', async ({ page }) => {
    const trigger = page.locator('#soundtrack-trigger');
    await trigger.click();

    const batbaleCard = page.locator('.soundtrack-track-card[data-track-id="batbale"]');
    const titleEl = page.locator('#soundtrack-current-title');

    await batbaleCard.click();
    await expect(batbaleCard).toHaveClass(/is-active/);
    await expect(batbaleCard).toHaveAttribute('aria-checked', 'true');
    await expect(titleEl).toHaveText('Molossus / Dark Knight Theme');

    const arkhamCard = page.locator('.soundtrack-track-card[data-track-id="arkham"]');
    await expect(arkhamCard).not.toHaveClass(/is-active/);
    await expect(arkhamCard).toHaveAttribute('aria-checked', 'false');
  });

  test('Volume slider and mute button update volume label and state', async ({ page }) => {
    const trigger = page.locator('#soundtrack-trigger');
    await trigger.click();

    const slider = page.locator('#soundtrack-volume');
    const volumeVal = page.locator('#soundtrack-volume-val');
    const muteBtn = page.locator('#soundtrack-volume-mute');

    await expect(slider).toHaveValue('40');
    await expect(volumeVal).toHaveText('40%');

    // Change slider value
    await slider.fill('75');
    await expect(volumeVal).toHaveText('75%');

    // Click mute button
    await muteBtn.click();
    await expect(volumeVal).toHaveText('MUTED');
    await expect(muteBtn).toHaveClass(/is-muted/);

    // Unmute
    await muteBtn.click();
    await expect(volumeVal).toHaveText('75%');
    await expect(muteBtn).not.toHaveClass(/is-muted/);
  });
});
