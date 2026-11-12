import { convertToParamMap } from '@angular/router';
import { DEFAULT_QUERY } from '../model/query-defaults';
import { parseQuery, toQueryParams } from './query-params';

const parse = (params: Record<string, string>) => parseQuery(convertToParamMap(params));

describe('parseQuery', () => {
  it('AC-U5 uses defaults for an empty query string', () => {
    expect(parse({})).toEqual(DEFAULT_QUERY);
  });

  it('AC-U2 reads every parameter', () => {
    expect(
      parse({
        q: 'abc',
        insurantId: 'A123456789',
        from: '2024-01-02',
        to: '2024-03-04',
        page: '3',
        pageSize: '10',
      }),
    ).toEqual({
      q: 'abc',
      insurantId: 'A123456789',
      from: '2024-01-02',
      to: '2024-03-04',
      page: 3,
      pageSize: 10,
    });
  });

  it.each([['abc'], ['0'], ['-2'], ['1.5'], ['']])('AC-U5 ignores page "%s"', (page) => {
    expect(parse({ page }).page).toBe(1);
  });

  it.each([['15'], ['abc'], ['0']])('AC-U5 ignores pageSize "%s"', (pageSize) => {
    expect(parse({ pageSize }).pageSize).toBe(20);
  });

  it('AC-U5 ignores malformed dates and Insurant IDs', () => {
    const query = parse({ from: '2024-13-01', to: '01.02.2024', insurantId: 'A12' });
    expect(query).toMatchObject({ from: '', to: '', insurantId: '' });
  });

  it('AC-U5 drops a "to" before "from"', () => {
    expect(parse({ from: '2024-05-01', to: '2024-04-01' })).toMatchObject({
      from: '2024-05-01',
      to: '',
    });
  });
});

describe('toQueryParams', () => {
  it('AC-U1 writes nothing for the defaults', () => {
    expect(toQueryParams(DEFAULT_QUERY)).toEqual({});
  });

  it('AC-U1 writes only values that differ', () => {
    expect(toQueryParams({ ...DEFAULT_QUERY, q: 'x', page: 2, pageSize: 20 })).toEqual({
      q: 'x',
      page: '2',
    });
  });
});
