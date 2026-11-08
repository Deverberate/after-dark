// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Feedback Verification: Audio Mute & Thunder & Eye Alignment', () => {
  test('1. Audio Off button switches music off immediately', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');

    // Simulate user interaction to initialize WayneAudioManager
    await page.mouse.click(100, 100);

    // Turn audio ON first if not on
    await page.evaluate(() => {
      if (window.wayneAudio && !window.wayneAudio.isEnabled()) {
        window.wayneAudio.toggle();
      }
    });

    const isAudioOn = await page.evaluate(() => window.wayneAudio.isEnabled());
    expect(isAudioOn).toBe(true);

    // Open soundtrack drawer and trigger play
    const trigger = page.locator('#soundtrack-trigger');
    await trigger.click();
    await page.waitForTimeout(300);

    const playBtn = page.locator('#soundtrack-play');
    await playBtn.click();
    await page.waitForTimeout(400);

    // Verify soundtrack is marked playing or player called
    const playingBefore = await page.evaluate(() => {
      const drawer = document.getElementById('soundtrack-drawer');
      return drawer?.classList.contains('is-playing');
    });

    // Close soundtrack drawer so backdrop doesn't block the header
    const closeBtn = page.locator('#soundtrack-close');
    await closeBtn.click();
    await page.waitForTimeout(200);

    // Now click the Audio toggle button (turning Audio to OFF)
    const audioToggle = page.locator('#audio-toggle');
    await audioToggle.click();
    await page.waitForTimeout(300);

    // Verify audio state is disabled
    const isAudioDisabled = await page.evaluate(() => window.wayneAudio.isEnabled());
    expect(isAudioDisabled).toBe(false);

    // Verify soundtrack is stopped / paused
    const playingAfter = await page.evaluate(() => {
      const drawer = document.getElementById('soundtrack-drawer');
      const eqState = document.getElementById('soundtrack-eq-state')?.textContent;
      return {
        hasIsPlayingClass: drawer?.classList.contains('is-playing'),
        eqText: eqState
      };
    });

    expect(playingAfter.hasIsPlayingClass).toBe(false);
    expect(playingAfter.eqText).toBe('STANDBY');
  });

  test('2. PlayThunder synthesizes sub-bass rumble and bandpassed crack without error', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');

    // Interact to allow Web Audio API
    await page.mouse.click(100, 100);

    const audioResult = await page.evaluate(() => {
      if (!window.wayneAudio) return { error: 'wayneAudio not found' };
      window.wayneAudio.init();
      window.wayneAudio.enabled = true;
      try {
        window.wayneAudio.play('thunder');
        return { success: true };
      } catch (err) {
        return { error: err.message };
      }
    });

    expect(audioResult.success).toBe(true);
    expect(audioResult.error).toBeUndefined();
  });

  test('3. Glowing cowl eyes exact coordinates and container aspect-ratio locking', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      const crouchFig = document.getElementById('prologue-figure-crouch');
      const standFig = document.getElementById('prologue-figure-stand');
      const crouchEyes = document.getElementById('p-eyes-crouch');
      const standEyes = document.getElementById('p-eyes-stand');

      const cCS = window.getComputedStyle(crouchFig);
      const sCS = window.getComputedStyle(standFig);
      const ceCS = window.getComputedStyle(crouchEyes);
      const seCS = window.getComputedStyle(standEyes);

      return {
        crouchAspectRatio: cCS.aspectRatio,
        standAspectRatio: sCS.aspectRatio,
        crouchEyesTop: ceCS.top,
        crouchEyesLeft: ceCS.left,
        standEyesTop: seCS.top,
        standEyesLeft: seCS.left,
        crouchBox: crouchFig.getBoundingClientRect(),
        standBox: standFig.getBoundingClientRect(),
        crouchEyesBox: crouchEyes.getBoundingClientRect(),
        standEyesBox: standEyes.getBoundingClientRect()
      };
    });

    // Check aspect-ratio locking
    expect(metrics.crouchAspectRatio).toMatch(/685\s*\/\s*1024/);
    expect(metrics.standAspectRatio).toMatch(/621\s*\/\s*960/);

    // Verify eye center placement relative to figure
    // Stage 1: eyes should be vertically around 46.5% (+/- 3%) and horizontally around 37.6% (+/- 3%)
    const cEyeYRel = (metrics.crouchEyesBox.top + metrics.crouchEyesBox.height / 2 - metrics.crouchBox.top) / metrics.crouchBox.height;
    const cEyeXRel = (metrics.crouchEyesBox.left + metrics.crouchEyesBox.width / 2 - metrics.crouchBox.left) / metrics.crouchBox.width;

    expect(cEyeYRel).toBeGreaterThan(0.43);
    expect(cEyeYRel).toBeLessThan(0.50);
    expect(cEyeXRel).toBeGreaterThan(0.34);
    expect(cEyeXRel).toBeLessThan(0.42);

    // Stage 2: eyes should be vertically around 23.4% (+/- 3%) and horizontally around 35.8% (+/- 3%)
    const sEyeYRel = (metrics.standEyesBox.top + metrics.standEyesBox.height / 2 - metrics.standBox.top) / metrics.standBox.height;
    const sEyeXRel = (metrics.standEyesBox.left + metrics.standEyesBox.width / 2 - metrics.standBox.left) / metrics.standBox.width;

    expect(sEyeYRel).toBeGreaterThan(0.20);
    expect(sEyeYRel).toBeLessThan(0.27);
    expect(sEyeXRel).toBeGreaterThan(0.32);
    expect(sEyeXRel).toBeLessThan(0.40);
  });
});
