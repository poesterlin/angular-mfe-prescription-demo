/** One medication prescribed to one Insurant on one day. Dates are ISO `yyyy-MM-dd`. */
export interface Prescription {
  readonly id: number;
  readonly medication: string;
  readonly insurantName: string;
  readonly insurantBirthDate: string;
  readonly insurantId: string;
  readonly prescribedOn: string;
}

/** What the view asks for. An empty string means "not set". */
export interface PrescriptionQuery {
  readonly q: string;
  readonly insurantId: string;
  readonly from: string;
  readonly to: string;
  readonly page: number;
  readonly pageSize: number;
}

/** One slice of the matching Prescriptions plus the totals (AC-D1). */
export interface PrescriptionPage {
  readonly items: readonly Prescription[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}
