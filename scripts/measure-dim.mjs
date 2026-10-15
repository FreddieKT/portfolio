// Usage: node scripts/measure-dim.mjs <baseUrl> [webkit|chromium]
// Taps through routes on an iPhone profile. Per navigation it reports frame gaps
// over 50ms, layout shift, and whether any content painted below full opacity or
// moved after first paint. Pass criteria: docs/superpowers/specs/2026-10-14-motion-refactor-design.md
import { chromium, webkit, devices } from '@playwright/test';

const [base, engine = 'webkit'] = process.argv.slice(2);
if (!base) throw new Error('usage: node scripts/measure-dim.mjs <baseUrl> [webkit|chromium]');
const browser = await (engine === 'chromium' ? chromium : webkit).launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
await ctx.addInitScript(() => {
  const t0 = performance.now();
  const log = (window.__motion = { gaps: [], shift: 0, dimmed: false, moved: false });
  let last = t0;
  let firstTop;
  const tick = (t) => {
    if (t - last > 50) log.gaps.push(Math.round(t - last));
    last = t;
    // .page-section / .section-panel are the content blocks GSAP used to fade (classes stay after the refactor)
    const el = document.querySelector('.page-section, .section-panel');
    if (el) {
      const top = el.getBoundingClientRect().top + scrollY;
      firstTop ??= top;
      if (Math.abs(top - firstTop) > 0.5) log.moved = true;
      if (getComputedStyle(el).opacity !== '1') log.dimmed = true;
    }
    if (t - t0 < 1500) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  new PerformanceObserver((list) => list.getEntries().forEach((e) => { log.shift += e.value; })).observe({ type: 'layout-shift', buffered: true });
});
const page = await ctx.newPage();
const routes = [
  ['/about/', 'a.nav-link[href="/contact"]'],
  ['/contact/', 'a.nav-link[href="/labs"]'],
  ['/labs/', 'a.brand-mark'],
  ['/', 'a.row-link'],
];
let failed = false;
for (const [from, selector] of routes) {
  await page.goto(base + from, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.locator(selector).first().tap();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1600);
  const m = await page.evaluate(() => window.__motion);
  const ok = m.gaps.length === 0 && m.shift === 0 && !m.dimmed && !m.moved;
  failed ||= !ok;
  console.log(JSON.stringify({ engine, from, to: page.url().replace(base, ''), ok, ...m }));
}
await browser.close();
process.exit(failed ? 1 : 0);
