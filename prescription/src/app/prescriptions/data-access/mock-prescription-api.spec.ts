import { firstValueFrom } from 'rxjs';
import type { PrescriptionPage, PrescriptionQuery } from '../model/prescription';
import { DEFAULT_QUERY } from '../model/query-defaults';
import { INSURANT_ID_PATTERN } from '../model/validation';
import { MockPrescriptionApi } from './mock-prescription-api';

const api = new MockPrescriptionApi();
const search = (query: Partial<PrescriptionQuery> = {}): Promise<PrescriptionPage> =>
  firstValueFrom(api.search({ ...DEFAULT_QUERY, ...query }));

describe('MockPrescriptionApi', () => {
  it('AC-D3 holds 1,000 Prescriptions in 2024–2025 with valid Insurant IDs', async () => {
    const all = await search({ pageSize: 50 });
    expect(all.total).toBe(1000);
    const dates = (
      await Promise.all([1, 20].map((page) => search({ pageSize: 50, page })))
    ).flatMap((p) => p.items.map((row) => row.prescribedOn));
    expect(dates.every((d) => d >= '2024-01-01' && d <= '2025-12-31')).toBe(true);
    expect(all.items.every((row) => INSURANT_ID_PATTERN.test(row.insurantId))).toBe(true);
  });

  it('AC-D3 returns the same rows on every call', async () => {
    expect(await search()).toEqual(await search());
    expect(new MockPrescriptionApi().search(DEFAULT_QUERY)).toBeTruthy();
  });

  it('AC-F3 orders by date descending, then id', async () => {
    const { items } = await search({ pageSize: 50 });
    for (let i = 1; i < items.length; i++) {
      const [a, b] = [items[i - 1], items[i]];
      expect(
        a.prescribedOn > b.prescribedOn || (a.prescribedOn === b.prescribedOn && a.id < b.id),
      ).toBe(true);
    }
  });

  it('AC-D1 pages: totals, size and last page', async () => {
    const page = await search({ page: 50 });
    expect(page).toMatchObject({ page: 50, pageSize: 20, total: 1000, totalPages: 50 });
    expect(page.items).toHaveLength(20);
  });

  it('AC-D4 returns the last page for a page past the end', async () => {
    expect((await search({ page: 999 })).page).toBe(50);
  });

  it('AC-Q1 Search matches medication, name and Insurant ID case-insensitively', async () => {
    const [first] = (await search()).items;
    for (const text of [
      first.medication.slice(0, 5).toUpperCase(),
      first.insurantName.toLowerCase(),
      first.insurantId.toLowerCase(),
    ]) {
      const result = await search({ q: text, pageSize: 50 });
      expect(result.items.map((r) => r.id)).toContain(first.id);
      expect(result.total).toBeLessThan(1000);
    }
  });

  it('AC-Q2 filters by exact Insurant ID, ignoring case', async () => {
    const [first] = (await search()).items;
    const result = await search({ insurantId: first.insurantId.toLowerCase(), pageSize: 50 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((r) => r.insurantId === first.insurantId)).toBe(true);
  });

  it('AC-Q3 date bounds are inclusive', async () => {
    const [first] = (await search()).items;
    const result = await search({ from: first.prescribedOn, to: first.prescribedOn, pageSize: 50 });
    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((r) => r.prescribedOn === first.prescribedOn)).toBe(true);
  });

  it('AC-F5 returns an empty first page when nothing matches', async () => {
    expect(await search({ q: 'no such thing' })).toMatchObject({
      total: 0,
      totalPages: 0,
      page: 1,
      items: [],
    });
  });

  it('AC-D4 falls back to defaults for invalid input', async () => {
    const page = await search({ page: -3, pageSize: 7, insurantId: 'bad', from: 'x' });
    expect(page).toMatchObject({ page: 1, pageSize: 20, total: 1000 });
  });
});
