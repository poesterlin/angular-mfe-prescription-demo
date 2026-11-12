import type { Observable } from 'rxjs';
import type { PrescriptionPage, PrescriptionQuery } from '../model/prescription';

/**
 * The Remote's only way to get data (C-A9). A real backend implements
 * `GET /api/prescriptions?q&insurantId&from&to&page&pageSize` behind this class.
 */
export abstract class PrescriptionApi {
  abstract search(query: PrescriptionQuery): Observable<PrescriptionPage>;
}
