import { expect, test } from '../../fixtures';
import { column, toIso, view } from './view';

test.beforeEach(async ({ page, mountPath }) => {
  await page.clock.install();
  await view(page, mountPath).open();
});

test('AC-Q1 Search matches medication, name or Insurant ID, ignoring case, after 300 ms', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  const [medication] = await column(v.rows, 0);
  const text = medication.slice(2, 8).toUpperCase();

  await v.search.fill(text);
  await page.clock.fastForward(250);
  expect(v.query().get('q')).toBeNull();
  await page.clock.fastForward(100);
  await expect(page).toHaveURL(/q=/);

  await v.open(`?q=${text.toLowerCase()}&pageSize=50`);
  const rows = await v.rows.allTextContents();
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.every((row) => row.toLowerCase().includes(text.toLowerCase()))).toBe(true);

  const [id] = await column(v.rows, 3);
  await v.open(`?q=${id.toLowerCase()}&pageSize=50`);
  expect((await column(v.rows, 3)).every((value) => value === id)).toBe(true);
});

test('AC-Q2 Insurant ID filters exactly and validates', async ({ page, mountPath }) => {
  const v = view(page, mountPath);
  const [id] = await column(v.rows, 3);

  await v.insurantId.fill(id.toLowerCase());
  await expect(page).toHaveURL(new RegExp(`insurantId=${id.toLowerCase()}`));
  expect((await column(v.rows, 3)).every((value) => value === id)).toBe(true);

  await v.insurantId.fill('A12');
  await expect(page.getByText('Enter one letter followed by nine digits')).toBeVisible();
  await expect(v.insurantId).toHaveValue('A12');
  await expect(page).not.toHaveURL(/insurantId/);
  await expect(v.count).toHaveText(/1,000 results/);
});

test('AC-Q3 the date range is inclusive and either bound may be empty', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  const [day] = (await column(v.rows, 4)).map(toIso);

  await v.from.fill(day);
  await v.to.fill(day);
  await expect(page).toHaveURL(new RegExp(`from=${day}&to=${day}`));
  const dates = await column(v.rows, 4);
  expect(dates.length).toBeGreaterThan(0);
  expect(dates.every((d) => toIso(d) === day)).toBe(true);

  await v.to.fill('');
  await expect(page).not.toHaveURL(/to=/);
  expect((await column(v.rows, 4)).every((d) => toIso(d) >= day)).toBe(true);
  await v.from.fill('');
  await expect(v.count).toHaveText(/1,000 results/);
});

test('AC-Q4 a "to" before "from" shows a message and is not applied', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await v.from.fill('2025-06-01');
  await v.to.fill('2025-07-01');
  await expect(page).toHaveURL(/to=2025-07-01/);

  await v.to.fill('2025-05-01');
  await expect(page.getByText('Must not be before the from date')).toBeVisible();
  await expect(page).not.toHaveURL(/to=/);
  await expect(page).toHaveURL(/from=2025-06-01/);

  await v.to.fill('2025-08-01');
  await expect(v.toError).toHaveText('');
  await expect(page).toHaveURL(/to=2025-08-01/);
});

test('AC-Q5 Reset clears everything, also during the debounce and with invalid text', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await v.open('?q=a&insurantId=A123456789&from=2024-01-01&to=2025-01-01&page=2&pageSize=10');
  await v.reset.click();
  await expect(page).toHaveURL(v.path);
  for (const field of [v.search, v.insurantId, v.from, v.to]) {
    await expect(field).toHaveValue('');
  }
  await expect(v.rowsPerPage).toHaveValue('20');

  await v.search.fill('abc');
  await v.reset.click();
  await page.clock.fastForward(1000);
  await expect(v.search).toHaveValue('');
  expect(v.query().get('q')).toBeNull();

  await v.insurantId.fill('nope');
  await expect(page.getByText('Enter one letter followed by nine digits')).toBeVisible();
  await v.reset.click();
  await expect(v.insurantId).toHaveValue('');
  await expect(v.insurantIdError).toHaveText('');
});

test('AC-Q6 the paginator shows range and position and disables what cannot move', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await expect(v.range).toHaveText('1–20 of 1,000');
  await expect(v.position).toHaveText('Page 1 of 50');
  await expect(v.first).toBeDisabled();
  await expect(v.previous).toBeDisabled();

  await v.next.click();
  await expect(v.range).toHaveText('21–40 of 1,000');
  await expect(v.first).toBeEnabled();
  await v.last.click();
  await expect(v.position).toHaveText('Page 50 of 50');
  await expect(v.next).toBeDisabled();
  await expect(v.last).toBeDisabled();
  await v.previous.click();
  await expect(v.position).toHaveText('Page 49 of 50');
  await v.first.click();
  await expect(v.position).toHaveText('Page 1 of 50');
});

test('AC-Q7 Rows per page offers 10, 20 and 50, default 20', async ({ page, mountPath }) => {
  const v = view(page, mountPath);
  await expect(v.rowsPerPage.locator('option')).toHaveText(['10', '20', '50']);
  await expect(v.rowsPerPage).toHaveValue('20');
  await expect(v.rows).toHaveCount(20);
  await v.rowsPerPage.selectOption('10');
  await expect(v.rows).toHaveCount(10);
  await expect(v.position).toHaveText('Page 1 of 100');
});

test('AC-Q8 changing Search, a Filter or the page size returns to page 1', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  const onPageThree = async () => {
    await v.open('?page=3');
    await expect(v.position).toHaveText('Page 3 of 50');
  };

  await onPageThree();
  await v.search.fill('a');
  await page.clock.fastForward(400);
  await expect(page).not.toHaveURL(/page=/);

  await onPageThree();
  await v.insurantId.fill('A123456789');
  await expect(page).not.toHaveURL(/page=/);

  await onPageThree();
  await v.from.fill('2024-01-01');
  await expect(page).not.toHaveURL(/page=/);

  await onPageThree();
  await v.rowsPerPage.selectOption('50');
  await expect(page).not.toHaveURL(/page=/);
  await expect(page).toHaveURL(/pageSize=50/);
});
