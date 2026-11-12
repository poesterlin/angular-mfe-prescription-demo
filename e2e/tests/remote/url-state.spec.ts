import { expect, test } from '../../fixtures';
import { view } from './view';

test.beforeEach(async ({ page }) => {
  await page.clock.install();
});

test('AC-U1 only non-default values are written to the query string', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await v.open();
  expect([...v.query().keys()]).toEqual([]);

  await v.next.click();
  await v.search.fill('a');
  await page.clock.fastForward(400);
  await v.rowsPerPage.selectOption('50');
  await expect(page).toHaveURL(/pageSize=50/);
  expect([...v.query().keys()].sort()).toEqual(['pageSize', 'q']);

  await v.rowsPerPage.selectOption('20');
  await expect(page).not.toHaveURL(/pageSize/);
});

test('AC-U2 a URL restores the fields and the table, also after reload', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await v.open('?q=a&from=2024-01-01&to=2025-12-31&pageSize=10');
  await expect(v.search).toHaveValue('a');
  await expect(v.from).toHaveValue('2024-01-01');
  await expect(v.to).toHaveValue('2025-12-31');
  await expect(v.rowsPerPage).toHaveValue('10');

  await v.open('?q=a&pageSize=10&page=2');
  await expect(v.position).toContainText('Page 2 of');
  const before = await v.rows.allTextContents();
  await page.reload();
  await expect(v.rows).toHaveCount(10);
  expect(await v.rows.allTextContents()).toEqual(before);
  await expect(v.search).toHaveValue('a');
});

test('AC-U3 Search and Filters replace the history entry; paging, size and Reset add one', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await v.open();
  let length = await v.historyLength();

  await v.search.fill('a');
  await page.clock.fastForward(400);
  await expect(page).toHaveURL(/q=a/);
  await v.to.fill('2025-12-31');
  await expect(page).toHaveURL(/to=/);
  await v.from.fill('2024-01-01');
  await expect(page).toHaveURL(/from=/);
  expect(await v.historyLength()).toBe(length);

  for (const act of [() => v.rowsPerPage.selectOption('10'), () => v.reset.click()]) {
    await act();
    await expect.poll(() => v.historyLength()).toBe(++length);
  }
  await v.next.click();
  await expect.poll(() => v.historyLength()).toBe(++length);
});

test('AC-U4 Back and Forward restore the state and the fields follow the URL', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await v.open('?insurantId=A123456789&from=2024-01-01');
  await v.reset.click();
  await expect(v.insurantId).toHaveValue('');

  await page.goBack();
  await expect(v.insurantId).toHaveValue('A123456789');
  await expect(v.from).toHaveValue('2024-01-01');
  await page.goForward();
  await expect(v.insurantId).toHaveValue('');
  await expect(v.from).toHaveValue('');

  await v.next.click();
  await expect(v.position).toHaveText(/Page 2 of/);
  await page.goBack();
  await expect(v.position).toHaveText(/Page 1 of/);
});

test('AC-U5 invalid query values are ignored without an error', async ({ page, mountPath }) => {
  const v = view(page, mountPath);
  for (const query of [
    '?page=abc',
    '?page=0',
    '?page=-1',
    '?pageSize=15',
    '?from=2024-13-45&to=nonsense',
    '?insurantId=xyz',
    '?from=2025-06-01&to=2025-01-01',
  ]) {
    await v.open(query);
    await expect(v.position).toContainText('Page 1 of');
    await expect(v.rowsPerPage).toHaveValue('20');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(v.insurantIdError).toHaveText('');
  }
  await v.open('?from=2025-06-01&to=2025-01-01');
  await expect(v.to).toHaveValue('');
  await expect(v.from).toHaveValue('2025-06-01');
});

test('AC-U6 a page beyond the last page shows the last and corrects the URL in place', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await v.open();
  await v.open('?page=999');
  await expect(page).toHaveURL(/page=50/);
  await expect(v.position).toHaveText('Page 50 of 50');
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${v.path}$`));
});

test('AC-I2 the path stays under the mount path while paging and filtering', async ({
  page,
  mountPath,
}) => {
  const v = view(page, mountPath);
  await v.open();
  await v.next.click();
  await v.rowsPerPage.selectOption('10');
  await v.insurantId.fill('A123456789');
  await v.reset.click();
  await v.last.click();
  await expect(v.position).toHaveText(/Page 50 of 50/);
  expect(new URL(page.url()).pathname).toBe(mountPath);
});
