import type { PrescriptionQuery } from './prescription';
import { DEFAULT_QUERY, PAGE_SIZES } from './query-defaults';
import { isInsurantId, isIsoDate } from './validation';

/**
 * Replaces every invalid value with its default (AC-U5, AC-D4). A `to` before `from`
 * is dropped, so the remaining range is still valid.
 */
export function normalizeQuery(raw: PrescriptionQuery): PrescriptionQuery {
  const from = normalizeFromDate(raw);

  const normalized = {
    ...raw,
    from,
    to: normalizeToDate(raw, from),
    insurantId: normalizeInsurantId(raw),
    page: normalizePage(raw),
    pageSize: normalizePageSize(raw),
  };

  return normalized;
}

export function normalizeToDate(raw: PrescriptionQuery, from: string): string {
  return isIsoDate(raw.to) && (from === '' || raw.to >= from) ? raw.to : '';
}

export function normalizeFromDate(raw: PrescriptionQuery): string {
  return isIsoDate(raw.from) ? raw.from : '';
}

export function normalizePageSize(raw: PrescriptionQuery): number {
  return PAGE_SIZES.some((size) => size === raw.pageSize) ? raw.pageSize : DEFAULT_QUERY.pageSize;
}

export function normalizePage(raw: PrescriptionQuery): number {
  return Number.isInteger(raw.page) && raw.page >= 1 ? raw.page : DEFAULT_QUERY.page;
}

export function normalizeInsurantId(raw: PrescriptionQuery): string {
  return isInsurantId(raw.insurantId) ? raw.insurantId : '';
}
