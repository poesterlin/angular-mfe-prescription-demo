import type { Params } from '@angular/router';
import type { PrescriptionQuery } from '../model/prescription';
import { normalizeQuery } from '../model/normalize-query';
import { DEFAULT_QUERY } from '../model/query-defaults';

interface ParamSource {
  get(name: string): string | null;
}

/** URL → query. Invalid values silently become their defaults (AC-U5). */
export function parseQuery(params: ParamSource): PrescriptionQuery {
  return normalizeQuery({
    q: params.get('q') ?? '',
    insurantId: params.get('insurantId') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    page: Number(params.get('page') ?? DEFAULT_QUERY.page),
    pageSize: Number(params.get('pageSize') ?? DEFAULT_QUERY.pageSize),
  });
}

/** Query → URL parameters. Only values that differ from the default are written (AC-U1). */
export function toQueryParams(query: PrescriptionQuery): Params {
  const params: Params = {};
  for (const key of ['q', 'insurantId', 'from', 'to', 'page', 'pageSize'] as const) {
    if (query[key] !== DEFAULT_QUERY[key]) {
      params[key] = String(query[key]);
    }
  }
  return params;
}
