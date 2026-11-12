import { expect, test } from '../../fixtures';
import { column, toIso, view } from './view';

test.beforeEach(async ({ page, mountPath }) => {
  await view(page, mountPath).open();
});

test('AC-F1 the view has the heading and the five columns in order', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await expect(v.heading).toBeVisible();
  await expect(page.getByRole('columnheader')).toHaveText([
    'Medication',
    'Insurant',
    'Birth date',
    'Insurant ID',
    'Prescribed on',
  ]);
});

test('AC-F2 dates are dd.MM.yyyy, with no time zone shift', async ({
  browser,
  mountPath,
  baseURL,
}) => {
  for (const timezoneId of ['Pacific/Kiritimati', 'America/Los_Angeles']) {
    const context = await browser.newContext({ timezoneId, baseURL });
    const page = await context.newPage();
    const v = view(page, mountPath);
    await v.open();
    const [day] = await column(v.rows, 4);
    const [birth] = await column(v.rows, 2);
    expect(day).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    expect(birth).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);

    await v.open(`?from=${toIso(day)}&to=${toIso(day)}&pageSize=50`);
    for (const shown of await column(v.rows, 4)) {
      expect(shown, timezoneId).toBe(day);
    }
    await context.close();
  }
});

test('AC-F3 rows are ordered by Prescription Date, newest first', async ({ page, mountPath }) => {
  const v = view(page, mountPath);
  await v.open('?pageSize=50');
  await expect(v.rows).toHaveCount(50);
  const dates = (await column(v.rows, 4)).map(toIso);
  expect(dates).toEqual([...dates].sort().reverse());
});

test('AC-F4 the result count is formatted and pluralised', async ({ page, mountPath }) => {
  const v = view(page, mountPath);
  await expect(v.count).toHaveText(/^\s*1,000 results\s*$/);

  await v.open('?pageSize=50');
  const ids = await column(v.rows, 3);
  const dates = (await column(v.rows, 4)).map(toIso);
  for (let i = 0; i < ids.length; i++) {
    await v.open(`?insurantId=${ids[i]}&from=${dates[i]}&to=${dates[i]}`);
    if ((await v.rows.count()) === 1) {
      await expect(v.count).toHaveText(/^\s*1 result\s*$/);
      return;
    }
  }
  throw new Error('no single-result combination found among the first 50 rows');
});

test('AC-F5 an empty result replaces the table with a message', async ({ page, mountPath }) => {
  const v = view(page, mountPath);
  await v.open('?q=no-such-medication');
  await expect(page.getByText('No prescriptions match your search.')).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(v.count).toHaveText(/^\s*0 results\s*$/);
});

test('AC-D1 the page the view shows is consistent with the query', async ({ page, mountPath }) => {
  const v = view(page, mountPath);
  await v.open('?pageSize=10&page=3');
  await expect(v.rows).toHaveCount(10);
  await expect(v.range).toHaveText('21–30 of 1,000');
  await expect(v.position).toHaveText('Page 3 of 100');
});

test('AC-D2 every row has all fields in the expected format', async ({ page, mountPath }) => {
  const v = view(page, mountPath);
  await v.open('?pageSize=50');
  const count = await v.rows.count();
  for (let c = 0; c < 5; c++) {
    const cells = await column(v.rows, c);
    expect(cells).toHaveLength(count);
    expect(cells.every((text) => text.trim() !== '')).toBe(true);
  }
  expect((await column(v.rows, 3)).every((id) => /^[A-Z]\d{9}$/.test(id))).toBe(true);
});

test('AC-D3 two loads show the same rows, within 2024–2025, with repeated Insurants', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await v.open('?pageSize=50');
  const first = await v.rows.allTextContents();
  await page.reload();
  await expect(v.rows).toHaveCount(50);
  expect(await v.rows.allTextContents()).toEqual(first);

  const years = (await column(v.rows, 4)).map((d) => d.slice(-4));
  expect(years.every((y) => y === '2024' || y === '2025')).toBe(true);

  const ids = await column(v.rows, 3);
  expect(new Set(ids).size).toBeLessThan(ids.length);
});

test('AC-D4 the mock answers a page past the end with the last page', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await v.open('?page=999&pageSize=50');
  await expect(v.position).toHaveText('Page 20 of 20');
  await expect(v.range).toHaveText('951–1,000 of 1,000');
});
