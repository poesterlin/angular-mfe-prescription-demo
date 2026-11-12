// usage: BASELINE_HOST=… EDGE_HOST=… node browser.mjs <path to e2e/package.json> <chromium|firefox> [runs]
import { createRequire } from 'node:module';
const pw = createRequire(process.argv[2])('@playwright/test');
const kind = process.argv[3]; const runs = Number(process.argv[4] ?? 3);
const targets = { baseline: `https://${process.env.BASELINE_HOST}`, edge: `https://${process.env.EDGE_HOST}` };
const browser = await pw[kind].launch();
console.log(kind, browser.version());
for (const [name, base] of Object.entries(targets)) {
  const times = []; const problems = new Set(); let ok = 0; let rows = 0; let urls = 0; let twice = 0; let nav = 'no';
  for (let i = 0; i < runs; i++) {
    const ctx = await browser.newContext(); const page = await ctx.newPage();
    if (kind === 'chromium') {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: -1, uploadThroughput: -1 });
    }
    if (kind === 'firefox') await page.route('**/*', async (route) => { await new Promise((r) => setTimeout(r, 100)); await route.continue(); });
    const seen = new Map();
    page.on('request', (r) => seen.set(r.url(), (seen.get(r.url()) ?? 0) + 1));
    page.on('pageerror', (e) => problems.add('pageerror: ' + String(e).slice(0, 200)));
    page.on('console', (m) => m.type() === 'error' && problems.add('console: ' + m.text().slice(0, 200)));
    const t0 = Date.now();
    try {
      await page.goto(`${base}/prescriptions?q=ibu`);
      await page.waitForSelector('table tbody tr', { timeout: 8000 });
      times.push(Date.now() - t0); ok++; rows = await page.locator('table tbody tr').count(); urls = seen.size; twice = [...seen].filter(([, n]) => n > 1).length;
      if (i === 0) { await page.goto(`${base}/`); await page.getByRole('link', { name: 'Prescriptions' }).click(); await page.waitForSelector('table tbody tr', { timeout: 8000 }); nav = 'ok'; }
    } catch { times.push(null); }
    await ctx.close();
  }
  const good = times.filter((t) => t !== null).sort((a, b) => a - b);
  console.log(name, `loaded ${ok}/${runs}`, good.length ? `median ${good[Math.floor(good.length / 2)]} ms` : '', JSON.stringify(times), 'rows', rows, 'urls', urls, 'twice', twice, 'nav', nav, 'errors', JSON.stringify([...problems]));
}
await browser.close();
