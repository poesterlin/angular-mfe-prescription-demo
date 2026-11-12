import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { REMOTE_URL, SHELL_URL } from '../urls';

interface RemoteEntry {
  name: string;
  exposes: { key: string }[];
}

test('AC-I1 the Remote is named "prescription" and exposes only ./routes', async ({ request }) => {
  const response = await request.get(`${REMOTE_URL}/remoteEntry.json`);
  expect(response.ok()).toBe(true);

  const entry = (await response.json()) as RemoteEntry;
  expect(entry.name).toBe('prescription');
  expect(entry.exposes.map((e) => e.key)).toEqual(['./routes']);
});

const PROPS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'color',
  'backgroundColor',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'boxSizing',
  'textAlign',
  'borderBottomWidth',
  'borderBottomStyle',
] as const;

async function styles(page: Page, selector: string): Promise<Record<string, string>> {
  return page
    .locator(selector)
    .first()
    .evaluate((el, props) => {
      const computed = getComputedStyle(el);
      return Object.fromEntries(props.map((p) => [p, computed[p]]));
    }, PROPS);
}

const REMOTE_ELEMENTS = {
  heading: 'h1',
  headerCell: 'th',
  bodyCell: 'td',
  searchInput: 'input[type="search"]',
};
const SHELL_ELEMENTS = { header: 'header', nav: 'nav' };

test('AC-I3 the Remote looks the same standalone and composed; the Shell without it', async ({
  page,
}) => {
  await page.goto(`${REMOTE_URL}/sandbox/prescriptions`);
  await expect(page.locator('td').first()).toBeVisible();
  const standalone: Record<string, Record<string, string>> = {};
  for (const [name, selector] of Object.entries(REMOTE_ELEMENTS)) {
    standalone[name] = await styles(page, selector);
  }

  await page.goto(`${SHELL_URL}/`);
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  const withoutRemote: Record<string, Record<string, string>> = {};
  for (const [name, selector] of Object.entries(SHELL_ELEMENTS)) {
    withoutRemote[name] = await styles(page, selector);
  }

  await page.goto(`${SHELL_URL}/prescriptions`);
  await expect(page.locator('td').first()).toBeVisible();
  for (const [name, selector] of Object.entries(REMOTE_ELEMENTS)) {
    expect(await styles(page, selector), `${name} composed`).toEqual(standalone[name]);
  }
  for (const [name, selector] of Object.entries(SHELL_ELEMENTS)) {
    expect(await styles(page, selector), `${name} with Remote`).toEqual(withoutRemote[name]);
  }
});
