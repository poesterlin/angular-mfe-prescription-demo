import { DEFAULT_QUERY } from '../model/query-defaults';
import { correctedPage } from './page-correction';

const page = (n: number) => ({ items: [], page: n, pageSize: 20, total: 1000, totalPages: 50 });
const query = { ...DEFAULT_QUERY, page: 99 };

describe('correctedPage', () => {
  it('AC-U6 returns the page the API actually served', () => {
    expect(correctedPage({ query, page: page(50) }, query)).toBe(50);
  });

  it('AC-U6 returns nothing when the requested page was served', () => {
    expect(correctedPage({ query, page: page(99) }, query)).toBeUndefined();
  });

  it('AC-U6 ignores an answer for an older query, and no answer', () => {
    expect(correctedPage({ query: DEFAULT_QUERY, page: page(1) }, query)).toBeUndefined();
    expect(correctedPage(undefined, query)).toBeUndefined();
  });
});
