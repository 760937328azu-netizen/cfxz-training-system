import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', msg => {
  console.log(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => {
  console.log(`[PAGE ERROR] ${err.message}`);
});

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'preview-debug.png', fullPage: true });
await browser.close();
console.log('debug screenshot done');
