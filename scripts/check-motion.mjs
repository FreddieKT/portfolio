// Usage: node scripts/check-motion.mjs <baseUrl>   (e.g. against `npm run preview`)
// Clicks a nav link in WebKit (iPhone) and desktop Chromium (its isMobile emulation skips view transitions) and checks the motion rules in docs/MOTION.md:
// the navigation uses a view transition, the header holds still, and content is never hidden after it paints.
import { webkit, chromium, devices } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.argv[2] ?? 'http://localhost:4321';

for (const [name, engine, device] of [['webkit', webkit, devices['iPhone 15']], ['chromium', chromium, devices['Desktop Chrome']]]) {
  // channel 'chromium' is the new headless mode, closer to real Chrome than the headless shell.
  const browser = await engine.launch(name === 'chromium' ? { channel: 'chromium' } : {});
  const page = await (await browser.newContext(device)).newPage();
  await page.addInitScript(() => {
    window.__vt = false;
    addEventListener('pagereveal', (e) => { window.__vt = Boolean(e.viewTransition); });
    window.__opacity = [];
    const sample = (t) => {
      const el = document.querySelector('.page-main');
      if (el) window.__opacity.push(+getComputedStyle(el).opacity);
      if (t < 1000) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  // Wait for prefetch like a reader would; headless Chromium often skips the transition when the
  // next page still has to be fetched on click.
  await page.goto(`${base}/contact`);
  await page.waitForLoadState('networkidle');
  const headerBefore = await page.locator('.site-header').boundingBox();
  await page.locator('a.nav-link[href="/about"]').click();
  await page.waitForURL('**/about');
  await page.waitForTimeout(1200);

  const { vt, opacity } = await page.evaluate(() => ({ vt: window.__vt, opacity: window.__opacity }));
  const headerAfter = await page.locator('.site-header').boundingBox();
  const drops = opacity.filter((o, i) => i > 0 && o < opacity[i - 1] - 0.01).length;

  assert.ok(vt, `${name}: navigation should run a view transition`);
  assert.equal(drops, 0, `${name}: content opacity dropped after paint`);
  assert.deepEqual(headerAfter, headerBefore, `${name}: header moved between pages`);
  console.log(`${name}: view transition ok, no post-paint hide, header still`);
  await browser.close();
}
