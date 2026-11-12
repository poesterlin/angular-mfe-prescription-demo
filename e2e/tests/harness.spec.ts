import { expect, test } from '../fixtures';
import { SHELL_URL } from '../urls';

test('AC-H1 the Remote runs on its own, and the Shell is served separately', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Prescriptions' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);

  expect((await request.get(SHELL_URL)).ok()).toBe(true);
});

test('AC-H2 the harness mounts the Remote at its own path with a banner', async ({
  page,
  mountPath,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(mountPath);
  await expect(page.getByRole('status')).toHaveText('Standalone mode');
  await expect(page.getByRole('heading', { name: 'Prescriptions' })).toBeVisible();
});

test('AC-H3 unknown paths show "Not found" without redirecting', async ({ page }) => {
  await page.goto('/prescriptions');
  await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible();
  await expect(page).toHaveURL('/prescriptions');
});
