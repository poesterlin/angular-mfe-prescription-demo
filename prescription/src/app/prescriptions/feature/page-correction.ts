import type { PrescriptionPage, PrescriptionQuery } from '../model/prescription';

export interface Answer {
  readonly query: PrescriptionQuery;
  readonly page: PrescriptionPage;
}

/**
 * The page number to put in the URL when the API answered with another page than
 * requested (AC-U6), or `undefined`. Answers for an older query are ignored.
 */
export function correctedPage(
  answer: Answer | undefined,
  current: PrescriptionQuery,
): number | undefined {
  const outdated = answer === undefined || answer.query !== current;
  return outdated || answer.page.page === current.page ? undefined : answer.page.page;
}
