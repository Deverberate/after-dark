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

  test('3. Eyes removed, Batman clearly visible in dark, with lightning chiaroscuro and cast body shadow', async ({ page }) => {
    await page.goto('http://127.0.0.1:3000');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      const crouchEyes = document.getElementById('p-eyes-crouch');
      const standEyes = document.getElementById('p-eyes-stand');
      const descentEyes = document.getElementById('p-eyes-descent');
      const anyEye = document.querySelector('.prologue__eye, .prologue__eyes');

      const crouchFig = document.getElementById('prologue-figure-crouch');
      const standFig = document.getElementById('prologue-figure-stand');
      const crouchBody = document.getElementById('p-body-crouch');
      const crouchShadow = document.getElementById('p-shadow-crouch');
      const standShadow = document.getElementById('p-shadow-stand');

      const cCS = window.getComputedStyle(crouchFig);
      const sCS = window.getComputedStyle(standFig);
      const cbCS = window.getComputedStyle(crouchBody);
      const csCS = window.getComputedStyle(crouchShadow);

      return {
        eyesRemoved: !crouchEyes && !standEyes && !descentEyes && !anyEye,
        crouchAspectRatio: cCS.aspectRatio,
        standAspectRatio: sCS.aspectRatio,
        crouchBodyOpacity: parseFloat(cbCS.opacity),
        crouchBodyFilter: cbCS.filter,
        ambientShadowOpacity: parseFloat(csCS.opacity),
        hasCastShadows: Boolean(crouchShadow && standShadow)
      };
    });

    // 1. Eyes completely removed
    expect(metrics.eyesRemoved).toBe(true);

    // 2. Aspect ratios locked
    expect(metrics.crouchAspectRatio).toMatch(/685\s*\/\s*1024/);
    expect(metrics.standAspectRatio).toMatch(/621\s*\/\s*960/);

    // 3. Batman clearly visible in normal dark (not 0.02 pitch-black silhouette)
    expect(metrics.crouchBodyOpacity).toBeGreaterThanOrEqual(0.8);
    expect(metrics.hasCastShadows).toBe(true);

    // 4. Test lightning strike dynamics: casts stark chiaroscuro & heavy body shadow
    const lightningDynamics = await page.evaluate(() => {
      const crouchFig = document.getElementById('prologue-figure-crouch');
      const crouchBody = document.getElementById('p-body-crouch');
      const crouchShadow = document.getElementById('p-shadow-crouch');
      const chiaroscuro = crouchBody.querySelector('.prologue__chiaroscuro');

      crouchFig.classList.add('is-lightning-lit');

      const bodyStyle = window.getComputedStyle(crouchBody);
      const shadowStyle = window.getComputedStyle(crouchShadow);
      const chiaroscuroStyle = chiaroscuro ? window.getComputedStyle(chiaroscuro) : null;

      const result = {
        litBodyFilter: bodyStyle.filter,
        litShadowOpacity: parseFloat(shadowStyle.opacity),
        litChiaroscuroOpacity: chiaroscuroStyle ? parseFloat(chiaroscuroStyle.opacity) : 0
      };

      crouchFig.classList.remove('is-lightning-lit');
      return result;
    });

    // During lightning: shadow opacity jumps high (casting body shadow)
    expect(lightningDynamics.litShadowOpacity).toBeGreaterThanOrEqual(0.8);
    // Face and body chiaroscuro overlay activates
    expect(lightningDynamics.litChiaroscuroOpacity).toBeGreaterThanOrEqual(0.85);
  });
});
