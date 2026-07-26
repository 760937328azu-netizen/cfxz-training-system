import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Capture the full scrollable content by expanding viewport
const fullHeight = await page.evaluate(() => {
  const main = document.querySelector('main');
  const scrollArea = main ? main.querySelector('div.overflow-y-auto') : null;
  return scrollArea ? scrollArea.scrollHeight + 128 : document.documentElement.scrollHeight;
});

await page.setViewportSize({ width: 1440, height: fullHeight });
await page.evaluate(() => {
  document.querySelectorAll('.overflow-y-auto').forEach(el => {
    el.style.overflow = 'visible';
  });
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'preview-full.png', fullPage: false });
await browser.close();
console.log('done');
