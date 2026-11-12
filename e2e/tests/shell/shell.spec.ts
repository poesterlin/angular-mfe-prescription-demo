import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures';
import { REMOTE_URL } from '../../urls';

const prescription = {
  name: 'prescription',
  remoteEntry: `${REMOTE_URL}/remoteEntry.json`,
  exposedModule: './routes',
  routePath: 'prescriptions',
  label: 'Prescriptions',
};

async function serveManifest(page: Page, body: string, status = 200): Promise<void> {
  await page.route('**/remotes.json', (route) =>
    route.fulfill({ status, contentType: 'application/json', body }),
  );
}

const nav = (page: Page) => page.getByRole('navigation', { name: 'Main navigation' });

test('AC-S1 the Shell shows a header with the app name and a labelled navigation', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('banner')).toContainText('Prescription Demo');
  await expect(nav(page)).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
});

test('AC-S2 "/" shows Welcome and the navigation links back to it', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  await nav(page).getByRole('link', { name: 'Prescriptions' }).click();
  await nav(page).getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});

test('AC-S3 the navigation has one link per manifest entry', async ({ page }) => {
  await page.goto('/');
  const links = nav(page).getByRole('link');
  await expect(links).toHaveText(['Home', 'Prescriptions']);
  await expect(nav(page).getByRole('link', { name: 'Prescriptions' })).toHaveAttribute(
    'href',
    '/prescriptions',
  );
});

test('AC-S4 the Remote loads into the content area, also on direct entry and reload', async ({
  page,
}) => {
  await page.goto('/');
  await nav(page).getByRole('link', { name: 'Prescriptions' }).click();
  await expect(page.getByRole('main').getByRole('heading', { name: 'Prescriptions' })).toBeVisible();
  await expect(nav(page)).toBeVisible();

  await page.goto('/prescriptions');
  await expect(page.getByRole('main').getByRole('heading', { name: 'Prescriptions' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('main').getByRole('heading', { name: 'Prescriptions' })).toBeVisible();
  await expect(nav(page)).toBeVisible();
});

test('AC-S5 unknown paths redirect to "/"', async ({ page }) => {
  await page.goto('/does/not/exist');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});

test('AC-M1 the manifest drives the navigation', async ({ page }) => {
  await serveManifest(page, JSON.stringify([{ ...prescription, label: 'Rx', routePath: 'rx' }]));
  await page.goto('/');
  await expect(nav(page).getByRole('link')).toHaveText(['Home', 'Rx']);
});

test('AC-M2 an invalid entry is skipped and logged', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await serveManifest(page, JSON.stringify([{ name: 'broken' }, prescription]));
  await page.goto('/');
  await expect(nav(page).getByRole('link')).toHaveText(['Home', 'Prescriptions']);
  expect(warnings.some((text) => text.includes('Skipping invalid Remote Manifest entry'))).toBe(true);
});

for (const [title, body, status] of [
  ['a non-list manifest', '{"remotes":[]}', 200],
  ['an unreadable manifest', 'not json', 200],
  ['a missing manifest', 'nope', 404],
] as const) {
  test(`AC-M2 ${title} still shows Welcome`, async ({ page }) => {
    await serveManifest(page, body, status);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    await expect(nav(page).getByRole('link')).toHaveText(['Home']);
  });
}

test('AC-M3 a changed route path in the manifest applies on the next load', async ({ page }) => {
  await serveManifest(page, JSON.stringify([{ ...prescription, routePath: 'rx' }]));
  await page.goto('/rx');
  await expect(page.getByRole('main').getByRole('heading', { name: 'Prescriptions' })).toBeVisible();
  await expect(nav(page).getByRole('link', { name: 'Prescriptions' })).toHaveAttribute('href', '/rx');
});

test('AC-E1 an unreachable Remote shows "unavailable" and the Shell keeps working', async ({
  page,
}) => {
  await page.route(`${REMOTE_URL}/remoteEntry.json`, (route) => route.abort());
  await page.goto('/prescriptions');
  await expect(page.getByRole('alert')).toHaveText('This Component is currently unavailable');
  await expect(nav(page)).toBeVisible();
  await nav(page).getByRole('link', { name: 'Home' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});
