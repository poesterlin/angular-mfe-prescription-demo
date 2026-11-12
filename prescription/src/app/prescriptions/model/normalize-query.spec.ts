import type { PrescriptionQuery } from './prescription';
import { DEFAULT_QUERY } from './query-defaults';
import {
  normalizeFromDate,
  normalizeInsurantId,
  normalizePage,
  normalizePageSize,
  normalizeQuery,
  normalizeToDate,
} from './normalize-query';

const query = (patch: Partial<PrescriptionQuery> = {}): PrescriptionQuery => ({
  ...DEFAULT_QUERY,
  ...patch,
});

describe('normalizeFromDate', () => {
  it('keeps a leap day', () => {
    expect(normalizeFromDate(query({ from: '2024-02-29' }))).toBe('2024-02-29');
  });

  it('AC-U5 drops an impossible calendar day', () => {
    expect(normalizeFromDate(query({ from: '2024-02-30' }))).toBe('');
  });
});

describe('normalizeToDate', () => {
  it('keeps a "to" equal to "from"', () => {
    expect(normalizeToDate(query({ to: '2024-06-01' }), '2024-06-01')).toBe('2024-06-01');
  });

  it('AC-U5 drops a "to" before "from"', () => {
    expect(normalizeToDate(query({ to: '2024-05-31' }), '2024-06-01')).toBe('');
  });

  it('AC-U5 drops an invalid "to"', () => {
    expect(normalizeToDate(query({ to: '2024-02-30' }), '')).toBe('');
  });
});

describe('normalizePageSize', () => {
  it.each([10, 20, 50])('keeps the offered page size %s', (pageSize) => {
    expect(normalizePageSize(query({ pageSize }))).toBe(pageSize);
  });

  it.each([15, Number.NaN])('AC-U5 defaults page size %s', (pageSize) => {
    expect(normalizePageSize(query({ pageSize }))).toBe(DEFAULT_QUERY.pageSize);
  });
});

describe('normalizePage', () => {
  it('keeps a positive page', () => {
    expect(normalizePage(query({ page: 1 }))).toBe(1);
  });

  it.each([0, Number.NaN])('AC-U5 defaults page %s', (page) => {
    expect(normalizePage(query({ page }))).toBe(DEFAULT_QUERY.page);
  });
});

describe('normalizeInsurantId', () => {
  it.each(['A123456789', 'z000000000'])('keeps the valid Insurant ID %s', (insurantId) => {
    expect(normalizeInsurantId(query({ insurantId }))).toBe(insurantId);
  });

  it('AC-U5 drops an invalid Insurant ID', () => {
    expect(normalizeInsurantId(query({ insurantId: 'A12' }))).toBe('');
  });
});

describe('normalizeQuery', () => {
  it('AC-U5 normalizes the lower bound before judging the range', () => {
    expect(normalizeQuery(query({ from: 'nonsense', to: '2024-06-01' }))).toMatchObject({
      from: '',
      to: '2024-06-01',
    });
  });

  it('AC-U5 defaults every invalid field and keeps the search text', () => {
    expect(
      normalizeQuery(
        query({
          q: 'gone',
          insurantId: 'bad',
          from: '2024-13-01',
          to: '2024-02-30',
          page: 0,
          pageSize: 15,
        }),
      ),
    ).toEqual({ ...DEFAULT_QUERY, q: 'gone' });
  });

  it('AC-U5 drops a "to" before a valid "from"', () => {
    expect(normalizeQuery(query({ from: '2024-06-01', to: '2024-05-01' }))).toMatchObject({
      from: '2024-06-01',
      to: '',
    });
  });
});
