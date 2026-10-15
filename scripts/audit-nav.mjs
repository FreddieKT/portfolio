// Usage: node scripts/audit-nav.mjs <baseUrl> <from> <linkText> [cpuSlowdown]
// Screencasts one navigation at 375px and reports frame gaps (jank), header-region change and scroll jumps.
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const [base, from = '/contact/', link = 'About', slow = '4', latency = '0'] = process.argv.slice(2);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: false, isMobile: false });
const page = await ctx.newPage();
await page.goto(base + from, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: +slow });
if (+latency) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: +latency, downloadThroughput: 200000, uploadThroughput: 100000 });
const frames = [];
cdp.on('Page.screencastFrame', async (f) => {
  frames.push({ t: f.metadata.timestamp, data: f.data, sy: f.metadata.scrollOffsetY });
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId });
});
await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
await page.waitForTimeout(300);
const t0 = Date.now() / 1000;
await page.getByRole('link', { name: link, exact: true }).first().click();
await page.waitForTimeout(2500);
await cdp.send('Page.stopScreencast');

const raw = async (f) => sharp(Buffer.from(f.data, 'base64')).resize(375, 812, { fit: 'fill' }).raw().toBuffer();
const diff = (a, b, y0, y1) => { let s = 0; for (let i = y0 * 375 * 3; i < y1 * 375 * 3; i++) s += Math.abs(a[i] - b[i]); return Math.round(s / ((y1 - y0) * 375 * 3) * 10) / 10; };
let prev = null, prevT = null; const rows = [];
for (const f of frames.filter((f) => f.t >= t0 - 0.05)) {
  const b = await raw(f);
  if (prev) rows.push({ t: Math.round((f.t - t0) * 1000), gap: Math.round((f.t - prevT) * 1000), head: diff(prev, b, 0, 70), body: diff(prev, b, 70, 812), sy: f.sy });
  prev = b; prevT = f.t;
}
console.log('t(ms) gap(ms) headerΔ bodyΔ scrollY');
for (const r of rows) console.log(`${r.t}\t${r.gap}\t${r.head}\t${r.body}\t${r.sy}`);
const late = rows.filter((r) => r.gap > 25);
console.log('SUMMARY frames>25ms:', late.length, 'worst gap:', Math.max(...rows.map((r) => r.gap)), 'ms; first change at', rows[0]?.t, 'ms');
console.log('max gap', Math.max(...rows.map((r) => r.gap)), 'ms; frames', rows.length, '; header moved frames', rows.filter((r) => r.head > 0.5).length);
await browser.close();
