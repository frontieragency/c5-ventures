import puppeteer from 'puppeteer';
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const outDir = join(process.cwd(), 'temporary screenshots');
await mkdir(outDir, { recursive: true });

// auto-increment screenshot-N(-label).png
const existing = await readdir(outDir).catch(() => []);
let max = 0;
for (const f of existing) {
  const m = f.match(/^screenshot-(\d+)/);
  if (m) max = Math.max(max, Number(m[1]));
}
const n = max + 1;
const name = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const out = join(outDir, name);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

// Scroll through the page so IntersectionObserver reveals fire, then return to top
await page.evaluate(async () => {
  const step = window.innerHeight * 0.6;
  for (let y = 0; y <= document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 900)); // let fonts/reveals settle
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
