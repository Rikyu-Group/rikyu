#!/usr/bin/env node
// プレゼン用スクリーンショット — reduced-motion で reveal を無効化して撮る
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const target = 'file://' + resolve(process.cwd(), 'dist/index.html');
const widths = [[375, 'mobile'], [768, 'tablet'], [1440, 'desktop']];

const browser = await chromium.launch();
for (const [w, name] of widths) {
  const page = await browser.newPage({
    viewport: { width: w, height: 900 },
    reducedMotion: 'reduce',
    deviceScaleFactor: w === 375 ? 2 : 1,
  });
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `audit/preview-${name}-${w}.png`, fullPage: true });
  await page.close();
  console.log(`audit/preview-${name}-${w}.png`);
}
await browser.close();
