import type { PrescriptionQuery } from './prescription';
import { DEFAULT_QUERY, PAGE_SIZES } from './query-defaults';
import { isInsurantId, isIsoDate } from './validation';

/**
 * Replaces every invalid value with its default (AC-U5, AC-D4). A `to` before `from`
 * is dropped, so the remaining range is still valid.
 */
export function normalizeQuery(raw: PrescriptionQuery): PrescriptionQuery {
  const from = isIsoDate(raw.from) ? raw.from : '';
  const to = isIsoDate(raw.to) && (from === '' || raw.to >= from) ? raw.to : '';
  return {
    q: raw.q,
    insurantId: isInsurantId(raw.insurantId) ? raw.insurantId : '',
    from,
    to,
    page: Number.isInteger(raw.page) && raw.page >= 1 ? raw.page : DEFAULT_QUERY.page,
    pageSize: PAGE_SIZES.some((size) => size === raw.pageSize)
      ? raw.pageSize
      : DEFAULT_QUERY.pageSize,
  };
}
