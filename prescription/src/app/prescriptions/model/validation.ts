/** One letter followed by nine digits (AC-D2). */
export const INSURANT_ID_PATTERN = /^[A-Za-z]\d{9}$/;

export function isInsurantId(value: string): boolean {
  return INSURANT_ID_PATTERN.test(value);
}

/** True for a real calendar day written as `yyyy-MM-dd`. */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}
