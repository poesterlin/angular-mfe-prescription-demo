import type { Locator, Page } from '@playwright/test';

/** Locators and helpers shared by the Remote specs. */
export function view(page: Page, mountPath: string) {
  return {
    path: mountPath,
    open: async (query = '') => {
      await page.goto(`${mountPath}${query}`);
      await page.locator('.rx-count').waitFor();
    },
    heading: page.getByRole('heading', { name: 'Prescriptions' }),
    rows: page.locator('tbody tr'),
    count: page.locator('.rx-count'),
    search: page.getByLabel('Search'),
    insurantId: page.getByLabel('Insurant ID'),
    from: page.getByLabel('Prescribed from'),
    to: page.getByLabel('Prescribed to'),
    insurantIdError: page.locator('#rx-insurant-id-error'),
    toError: page.locator('#rx-to-error'),
    reset: page.getByRole('button', { name: 'Reset' }),
    first: page.getByRole('button', { name: 'First' }),
    previous: page.getByRole('button', { name: 'Previous' }),
    next: page.getByRole('button', { name: 'Next' }),
    last: page.getByRole('button', { name: 'Last' }),
    rowsPerPage: page.getByLabel('Rows per page'),
    range: page.locator('.rx-range'),
    position: page.locator('.rx-position'),
    query: () => new URL(page.url()).searchParams,
    historyLength: () => page.evaluate(() => history.length),
  };
}

export type View = ReturnType<typeof view>;

/** Text of every cell in a column of the visible rows (0-based). */
export async function column(rows: Locator, index: number): Promise<string[]> {
  await rows.first().waitFor();
  return rows.locator(`td:nth-child(${index + 1})`).allTextContents();
}

/** `dd.MM.yyyy` → `yyyy-MM-dd`. */
export function toIso(display: string): string {
  const [day, month, year] = display.split('.');
  return `${year}-${month}-${day}`;
}
