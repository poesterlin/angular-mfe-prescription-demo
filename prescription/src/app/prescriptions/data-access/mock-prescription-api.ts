import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { Prescription, PrescriptionPage, PrescriptionQuery } from '../model/prescription';
import { normalizeQuery } from '../model/normalize-query';
import { createPrescriptions } from './prescription-seed';
import { PrescriptionApi } from './prescription-api';

function matchesSearch(row: Prescription, text: string): boolean {
  return (
    text === '' ||
    row.medication.toLowerCase().includes(text) ||
    row.insurantName.toLowerCase().includes(text) ||
    row.insurantId.toLowerCase().includes(text)
  );
}

function matches(row: Prescription, query: PrescriptionQuery, text: string): boolean {
  return (
    matchesSearch(row, text) &&
    (query.insurantId === '' || row.insurantId.toLowerCase() === query.insurantId.toLowerCase()) &&
    (query.from === '' || row.prescribedOn >= query.from) &&
    (query.to === '' || row.prescribedOn <= query.to)
  );
}

/** In-memory stand-in for the backend: does Search, Filter, ordering and paging itself. */
@Injectable()
export class MockPrescriptionApi extends PrescriptionApi {
  private readonly rows = createPrescriptions();

  search(raw: PrescriptionQuery): Observable<PrescriptionPage> {
    const query = normalizeQuery(raw);
    const text = query.q.trim().toLowerCase();
    const matching = this.rows.filter((row) => matches(row, query, text));
    const totalPages = Math.ceil(matching.length / query.pageSize);
    const page = Math.min(query.page, Math.max(totalPages, 1));
    const start = (page - 1) * query.pageSize;
    return of({
      items: matching.slice(start, start + query.pageSize),
      page,
      pageSize: query.pageSize,
      total: matching.length,
      totalPages,
    });
  }
}
