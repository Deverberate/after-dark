// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Adversarial Challenge: Workload Selector & URL Synchronization', () => {
  let consoleErrors = [];
  let pageErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    pageErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
  });

  test.afterEach(async ({}, testInfo) => {
    if (pageErrors.length > 0) {
      console.log(`[PAGE ERROR in ${testInfo.title}]:`, pageErrors);
    }
    if (consoleErrors.length > 0) {
      console.log(`[CONSOLE ERROR in ${testInfo.title}]:`, consoleErrors);
    }
  });

  // --------------------------------------------------------------------------
  // Challenge 1: Direct Deep-Link Navigation with Valid Profiles
  // --------------------------------------------------------------------------
  test('Challenge 1.1: Direct visit with ?workload=extreme activates M4 Max profile and preserves URL', async ({ page }) => {
    await page.goto('/?workload=extreme');

    const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
    const proRadio = page.locator('input[name="workload"][value="professional"]');
    const everydayRadio = page.locator('input[name="workload"][value="everyday"]');

    await expect(extremeRadio).toBeChecked();
    await expect(proRadio).not.toBeChecked();
    await expect(everydayRadio).not.toBeChecked();

    await expect(page.locator('#fit-name')).toHaveText('M4 Max');
    await expect(page.locator('#fit-model')).toHaveText('16-inch MacBook Pro with M4 Max');
    await expect(page.locator('#fit-copy')).toContainText('Up to 16 CPU cores, up to 40 GPU cores, and 546');
    await expect(page.locator('#fit-copy')).toContainText('unified memory bandwidth');

    // Verify URL is strictly preserved without unwanted redirects or stripped params
    expect(page.url()).toContain('?workload=extreme');
  });

  test('Challenge 1.2: Direct visit with ?workload=professional activates M4 Pro profile and preserves URL', async ({ page }) => {
    await page.goto('/?workload=professional');

    const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
    const proRadio = page.locator('input[name="workload"][value="professional"]');
    const everydayRadio = page.locator('input[name="workload"][value="everyday"]');

    await expect(proRadio).toBeChecked();
    await expect(extremeRadio).not.toBeChecked();
    await expect(everydayRadio).not.toBeChecked();

    await expect(page.locator('#fit-name')).toHaveText('M4 Pro');
    await expect(page.locator('#fit-model')).toHaveText('14- or 16-inch MacBook Pro with M4 Pro');
    await expect(page.locator('#fit-copy')).toContainText('Up to 14 CPU cores, up to 20 GPU cores, and 273');

    expect(page.url()).toContain('?workload=professional');
  });

  test('Challenge 1.3: Direct visit with ?workload=everyday activates base M4 profile and preserves URL', async ({ page }) => {
    await page.goto('/?workload=everyday');

    const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
    const proRadio = page.locator('input[name="workload"][value="professional"]');
    const everydayRadio = page.locator('input[name="workload"][value="everyday"]');

    await expect(everydayRadio).toBeChecked();
    await expect(proRadio).not.toBeChecked();
    await expect(extremeRadio).not.toBeChecked();

    await expect(page.locator('#fit-name')).toHaveText('M4');
    await expect(page.locator('#fit-model')).toHaveText('14-inch MacBook Pro with M4');
    await expect(page.locator('#fit-copy')).toContainText('Ten CPU cores and ten GPU cores');

    expect(page.url()).toContain('?workload=everyday');
  });

  // --------------------------------------------------------------------------
  // Challenge 2: Adversarial & Invalid Values Graceful Fallback
  // --------------------------------------------------------------------------
  const invalidCases = [
    { name: 'arbitrary string', param: '?workload=invalid' },
    { name: 'XSS script injection vector', param: '?workload=%3Cscript%3Ealert(1)%3C/script%3E' },
    { name: 'numeric value', param: '?workload=123' },
    { name: 'empty string value', param: '?workload=' },
    { name: 'prototype pollution probe toString', param: '?workload=toString' },
    { name: 'prototype pollution probe __proto__', param: '?workload=__proto__' },
    { name: 'prototype pollution probe constructor', param: '?workload=constructor' },
    { name: 'case mismatch EXTREME', param: '?workload=EXTREME' },
    { name: 'space-padded workload', param: '?workload=%20professional%20' },
  ];

  for (const { name, param } of invalidCases) {
    test(`Challenge 2: Gracefully falls back to default on ${name} (${param})`, async ({ page }) => {
      await page.goto(`/${param}`);

      const everydayRadio = page.locator('input[name="workload"][value="everyday"]');
      const proRadio = page.locator('input[name="workload"][value="professional"]');
      const extremeRadio = page.locator('input[name="workload"][value="extreme"]');

      // Everyday radio must remain or become checked as safe fallback
      await expect(everydayRadio).toBeChecked();
      await expect(proRadio).not.toBeChecked();
      await expect(extremeRadio).not.toBeChecked();

      // Fit copy and title must match everyday configuration (M4)
      await expect(page.locator('#fit-name')).toHaveText('M4');
      await expect(page.locator('#fit-model')).toHaveText('14-inch MacBook Pro with M4');
      await expect(page.locator('#fit-copy')).toContainText('Ten CPU cores and ten GPU cores');
    });
  }

  // --------------------------------------------------------------------------
  // Challenge 3: Interactive Switching, Hash Preservation & No Page Reload
  // --------------------------------------------------------------------------
  test('Challenge 3.1: Clicking between radios updates URL without page reload and preserves hash #silicon', async ({ page }) => {
    await page.goto('/#silicon');

    // Plant a sentinel variable on the window object to detect page reloads
    await page.evaluate(() => {
      window.__canary_no_reload = 'BATMAN_RELOAD_SENTINEL_ACTIVE';
    });

    const proRadio = page.locator('input[name="workload"][value="professional"]');
    const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
    const everydayRadio = page.locator('input[name="workload"][value="everyday"]');

    // Ensure the workload component is in view
    await page.locator('.workload').scrollIntoViewIfNeeded();

    // Click professional
    await proRadio.check({ force: true });
    await expect(proRadio).toBeChecked();
    expect(page.url()).toContain('workload=professional');
    expect(page.url()).toContain('#silicon');
    await expect(page.locator('#fit-name')).toHaveText('M4 Pro');

    // Sentinel must still exist (guarantees NO page reload occurred)
    const canary1 = await page.evaluate(() => window.__canary_no_reload);
    expect(canary1).toBe('BATMAN_RELOAD_SENTINEL_ACTIVE');

    // Click extreme
    await extremeRadio.check({ force: true });
    await expect(extremeRadio).toBeChecked();
    expect(page.url()).toContain('workload=extreme');
    expect(page.url()).toContain('#silicon');
    await expect(page.locator('#fit-name')).toHaveText('M4 Max');

    const canary2 = await page.evaluate(() => window.__canary_no_reload);
    expect(canary2).toBe('BATMAN_RELOAD_SENTINEL_ACTIVE');

    // Click back to everyday
    await everydayRadio.check({ force: true });
    await expect(everydayRadio).toBeChecked();
    expect(page.url()).toContain('workload=everyday');
    expect(page.url()).toContain('#silicon');
    await expect(page.locator('#fit-name')).toHaveText('M4');

    const canary3 = await page.evaluate(() => window.__canary_no_reload);
    expect(canary3).toBe('BATMAN_RELOAD_SENTINEL_ACTIVE');
  });

  test('Challenge 3.2: Switching workload preserves other URL query parameters alongside hash', async ({ page }) => {
    await page.goto('/?source=batcomputer&mode=stealth#silicon');

    await page.locator('.workload').scrollIntoViewIfNeeded();
    const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
    await extremeRadio.check({ force: true });

    await expect(extremeRadio).toBeChecked();
    const currentUrl = page.url();

    // Verify workload is set, and source/mode/hash are all preserved
    expect(currentUrl).toContain('workload=extreme');
    expect(currentUrl).toContain('source=batcomputer');
    expect(currentUrl).toContain('mode=stealth');
    expect(currentUrl).toContain('#silicon');
  });

  // --------------------------------------------------------------------------
  // Challenge 4: History Management & State Replacement
  // --------------------------------------------------------------------------
  test('Challenge 4.1: history.replaceState does not bloat browser session history stack', async ({ page }) => {
    await page.goto('/');

    const initialHistoryLength = await page.evaluate(() => window.history.length);

    const proRadio = page.locator('input[name="workload"][value="professional"]');
    const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
    const everydayRadio = page.locator('input[name="workload"][value="everyday"]');

    // Perform multiple rapid switches
    await proRadio.check({ force: true });
    await extremeRadio.check({ force: true });
    await everydayRadio.check({ force: true });
    await proRadio.check({ force: true });

    const postSwitchHistoryLength = await page.evaluate(() => window.history.length);

    // Because history.replaceState is used, length must remain identical
    expect(postSwitchHistoryLength).toBe(initialHistoryLength);
  });

  test('Challenge 4.2: Full browser back and forward navigation restores workload state cleanly', async ({ page }) => {
    // 1. Visit professional profile directly
    await page.goto('/?workload=professional');
    await expect(page.locator('input[name="workload"][value="professional"]')).toBeChecked();
    await expect(page.locator('#fit-name')).toHaveText('M4 Pro');

    // 2. Navigate to extreme profile directly
    await page.goto('/?workload=extreme');
    await expect(page.locator('input[name="workload"][value="extreme"]')).toBeChecked();
    await expect(page.locator('#fit-name')).toHaveText('M4 Max');

    // 3. Browser Back button
    await page.goBack();
    expect(page.url()).toContain('workload=professional');
    await expect(page.locator('input[name="workload"][value="professional"]')).toBeChecked();
    await expect(page.locator('#fit-name')).toHaveText('M4 Pro');

    // 4. Browser Forward button
    await page.goForward();
    expect(page.url()).toContain('workload=extreme');
    await expect(page.locator('input[name="workload"][value="extreme"]')).toBeChecked();
    await expect(page.locator('#fit-name')).toHaveText('M4 Max');
  });

  // --------------------------------------------------------------------------
  // Challenge 5: Cross-Component Event Emission & HUD Sync
  // --------------------------------------------------------------------------
  test('Challenge 5: workloadchange event dispatches correct profile and updates HUD telemetry', async ({ page }) => {
    await page.goto('/');

    // Monitor custom 'workloadchange' event
    await page.evaluate(() => {
      window.__lastWorkloadDetail = null;
      window.addEventListener('workloadchange', (e) => {
        window.__lastWorkloadDetail = e.detail;
      });
    });

    const extremeRadio = page.locator('input[name="workload"][value="extreme"]');
    await extremeRadio.check({ force: true });

    const eventDetail = await page.evaluate(() => window.__lastWorkloadDetail);
    expect(eventDetail).not.toBeNull();
    expect(eventDetail.name).toBe('M4 Max');
    expect(eventDetail.model).toBe('16-inch MacBook Pro with M4 Max');

    // Check HUD diagnostic display if HUD is active
    const hudWorkload = page.locator('#telemetry-workload-name');
    if (await hudWorkload.count() > 0) {
      await expect(hudWorkload).toHaveText('M4 Max Profile');
    }
  });

  // --------------------------------------------------------------------------
  // Challenge 6: Switch Latency / Performance Budget
  // --------------------------------------------------------------------------
  test('Challenge 6: Workload switch completes within a single animation frame budget (<16ms)', async ({ page }) => {
    await page.goto('/');

    const extremeRadio = page.locator('input[name="workload"][value="extreme"]');

    // Measure execution duration of radio change event listener and DOM sync
    const durationMs = await page.evaluate(async () => {
      const radio = document.querySelector('input[name="workload"][value="extreme"]');
      const start = performance.now();
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      const end = performance.now();
      return end - start;
    });

    // Must be well within a 16.6ms frame
    expect(durationMs).toBeLessThan(16.0);
  });

  // --------------------------------------------------------------------------
  // Challenge 7: Console Cleanliness & Uncaught Errors Audit
  // --------------------------------------------------------------------------
  test('Challenge 7 (Console Defect Audit): Direct page load does not trigger unhandled browser console errors', async ({ page }) => {
    const caughtConsoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        caughtConsoleErrors.push(msg.text());
      }
    });

    await page.goto('/?workload=extreme');

    // The browser console must be completely clean
    expect(caughtConsoleErrors, `Direct visit produced console error: ${caughtConsoleErrors.join('; ')}`).toHaveLength(0);
  });
});

