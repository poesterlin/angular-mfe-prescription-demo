import { DEFAULT_QUERY } from '../model/query-defaults';
import { changedFilters } from './filter-diff';

const none = { insurantId: '', from: '', to: '' };

describe('changedFilters', () => {
  it('AC-Q2 returns nothing when the effective values equal the query', () => {
    expect(changedFilters(none, DEFAULT_QUERY)).toEqual({});
  });

  it('AC-Q2 returns only the fields that differ', () => {
    const current = { ...DEFAULT_QUERY, from: '2024-01-01' };
    expect(
      changedFilters({ ...none, from: '2024-01-01', insurantId: 'A123456789' }, current),
    ).toEqual({
      insurantId: 'A123456789',
    });
  });

  it('AC-Q4 reports a removed filter as an empty value', () => {
    const current = { ...DEFAULT_QUERY, to: '2024-05-01' };
    expect(changedFilters(none, current)).toEqual({ to: '' });
  });
});
