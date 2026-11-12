import type { PrescriptionQuery } from '../model/prescription';

export type FilterField = 'insurantId' | 'from' | 'to';
export type FilterValues = Record<FilterField, string>;

const FIELDS: readonly FilterField[] = ['insurantId', 'from', 'to'];

/** The filter fields whose effective value differs from what the query holds. */
export function changedFilters(
  effective: FilterValues,
  current: PrescriptionQuery,
): Partial<FilterValues> {
  const changed: Partial<FilterValues> = {};
  for (const field of FIELDS) {
    if (effective[field] !== current[field]) {
      changed[field] = effective[field];
    }
  }
  return changed;
}
