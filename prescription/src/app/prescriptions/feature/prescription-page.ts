import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { correctedPage } from './page-correction';
import { PrescriptionApi } from '../data-access/prescription-api';
import { parseQuery, toQueryParams } from '../data-access/query-params';
import type { PrescriptionQuery } from '../model/prescription';
import { DEFAULT_QUERY } from '../model/query-defaults';
import { type FilterChange, PrescriptionFilters } from '../ui/prescription-filters';
import { PrescriptionPaginator } from '../ui/prescription-paginator';
import { PrescriptionTable } from '../ui/prescription-table';

/**
 * Container for the Prescriptions view. The URL is the single source of truth (C-A8):
 * input navigates, the query is read back from the URL, the resource loads it.
 */
@Component({
  selector: 'rx-prescription-page',
  imports: [PrescriptionFilters, PrescriptionTable, PrescriptionPaginator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './prescription-page.css',
  template: `
    <h1 class="rx-title">Prescriptions</h1>
    <rx-prescription-filters
      [query]="query()"
      (searchChange)="change({ q: $event }, true)"
      (filterChange)="change($event, true)"
      (reset)="reset()"
    />
    @if (results.error()) {
      <div class="rx-alert" role="alert">
        <p>Prescriptions could not be loaded</p>
        <button type="button" (click)="results.reload()">Retry</button>
      </div>
    } @else if (current(); as page) {
      <rx-prescription-table [items]="page.items" [total]="page.total" />
      @if (page.total > 0) {
        <rx-prescription-paginator
          [data]="page"
          (pageChange)="go({ page: $event })"
          (pageSizeChange)="go({ pageSize: $event, page: 1 })"
        />
      }
    }
  `,
})
export class PrescriptionPage {
  private readonly api = inject(PrescriptionApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly query = computed(() => parseQuery(this.params()));

  /** Pairs each answer with the query it was loaded for, so a stale answer is recognisable. */
  protected readonly results = rxResource({
    params: this.query,
    stream: ({ params }) => this.api.search(params).pipe(map((page) => ({ query: params, page }))),
  });

  protected readonly current = computed(() => this.results.value()?.page);

  constructor() {
    // A page past the end shows the last page; correct the URL without a new history entry (AC-U6).
    effect(() => {
      const page = correctedPage(
        this.results.error() ? undefined : this.results.value(),
        this.query(),
      );
      if (page !== undefined) {
        this.navigate({ ...this.query(), page }, true);
      }
    });
  }

  /** Search and Filter changes: back to page 1, replacing the history entry (AC-Q8, AC-U3). */
  protected change(change: Partial<PrescriptionQuery> | FilterChange, replace: boolean): void {
    this.navigate({ ...this.query(), ...change, page: 1 }, replace);
  }

  /** Page and page size changes add a history entry (AC-U3). */
  protected go(change: Partial<PrescriptionQuery>): void {
    this.navigate({ ...this.query(), ...change }, false);
  }

  protected reset(): void {
    this.navigate(DEFAULT_QUERY, false);
  }

  private navigate(next: PrescriptionQuery, replaceUrl: boolean): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams(next),
      replaceUrl,
    });
  }
}
