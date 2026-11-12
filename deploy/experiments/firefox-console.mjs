import { createRequire } from 'node:module';
const pw = createRequire(process.argv[2])('@playwright/test');
const b = await pw.firefox.launch(); const page = await b.newPage();
page.on('console', async (m) => { const parts = []; for (const a of m.args()) { parts.push(await a.evaluate((v) => v instanceof Error ? `${v.name}: ${v.message}` : (typeof v === 'object' ? JSON.stringify(v) : String(v))).catch(() => '?')); } console.log('console', m.type(), parts.join(' ').slice(0, 400)); });
page.on('pageerror', (e) => console.log('pageerror', String(e).slice(0, 300)));
page.on('requestfailed', (r) => console.log('failed', r.url()));
await page.goto(process.argv[3]); await page.waitForTimeout(4000);
console.log('rows', await page.locator('table tbody tr').count(), '| body:', (await page.locator('body').innerText()).slice(0, 150).replace(/\n/g, ' | '));
await b.close();
