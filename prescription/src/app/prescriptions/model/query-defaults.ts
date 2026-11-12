import type { PrescriptionQuery } from './prescription';

export const PAGE_SIZES = [10, 20, 50] as const;

export const DEFAULT_QUERY: PrescriptionQuery = {
  q: '',
  insurantId: '',
  from: '',
  to: '',
  page: 1,
  pageSize: 20,
};
