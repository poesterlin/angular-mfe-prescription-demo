import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { PrescriptionPage } from '../model/prescription';
import { PAGE_SIZES } from '../model/query-defaults';

/** Range, position, First/Previous/Next/Last and "Rows per page" (AC-Q6, AC-Q7). */
@Component({
  selector: 'rx-prescription-paginator',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './prescription-paginator.css',
  template: `
    <nav class="rx-paginator" aria-label="Pagination">
      <label class="rx-size">
        Rows per page
        <select (change)="pageSizeChange.emit(sizeOf($event))">
          @for (size of sizes; track size) {
            <option [value]="size" [selected]="size === data().pageSize">{{ size }}</option>
          }
        </select>
      </label>
      <span class="rx-range"
        >{{ first() | number }}–{{ last() | number }} of {{ data().total | number }}</span
      >
      <span class="rx-position">Page {{ data().page }} of {{ data().totalPages }}</span>
      <button type="button" [disabled]="data().page <= 1" (click)="pageChange.emit(1)">
        First
      </button>
      <button
        type="button"
        [disabled]="data().page <= 1"
        (click)="pageChange.emit(data().page - 1)"
      >
        Previous
      </button>
      <button
        type="button"
        [disabled]="data().page >= data().totalPages"
        (click)="pageChange.emit(data().page + 1)"
      >
        Next
      </button>
      <button
        type="button"
        [disabled]="data().page >= data().totalPages"
        (click)="pageChange.emit(data().totalPages)"
      >
        Last
      </button>
    </nav>
  `,
})
export class PrescriptionPaginator {
  readonly data = input.required<PrescriptionPage>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly sizes = PAGE_SIZES;
  protected readonly first = computed(() => (this.data().page - 1) * this.data().pageSize + 1);
  protected readonly last = computed(() =>
    Math.min(this.data().page * this.data().pageSize, this.data().total),
  );

  protected sizeOf(event: Event): number {
    return Number((event.target as HTMLSelectElement).value);
  }
}
