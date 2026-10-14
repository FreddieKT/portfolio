// Usage: node scripts/measure-dim.mjs <baseUrl> [from] [linkText]
// Clicks a nav link on a 375px page, screencasts the navigation and prints mean brightness per frame.
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const [base, from = '/contact/', link = 'About'] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(base + from, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  frames.push({ t: f.metadata.timestamp, data: f.data });
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId });
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, everyNthFrame: 1 });
await page.waitForTimeout(200);
const t0 = Date.now() / 1000;
await page.getByRole('link', { name: link, exact: true }).first().click();
await page.waitForTimeout(2000);
await cdp.send('Page.stopScreencast');

const out = [];
for (const f of frames) {
  const { channels } = await sharp(Buffer.from(f.data, 'base64')).stats();
  const lum = channels.reduce((s, c) => s + c.mean, 0) / channels.length;
  out.push([Math.round((f.t - t0) * 1000), Math.round(lum)]);
}
console.log(base, 'url after:', page.url());
console.log(out.filter(([t]) => t > -400).map(([t, l]) => `${t}ms:${l}`).join(' '));
await browser.close();
