import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  type WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { filter, map, type Observable, Subject, switchMap, takeUntil, timer } from 'rxjs';
import type { PrescriptionQuery } from '../model/prescription';
import { changedFilters, type FilterField, type FilterValues } from './filter-diff';
import { isInsurantId } from '../model/validation';

export type FilterChange = Partial<FilterValues>;

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search, Insurant ID and date fields plus Reset (AC-Q1–Q5, AC-U4). Each field keeps a
 * draft that follows the URL value; an invalid draft is shown with its message, and
 * removes the filter it replaces, so the URL never holds a value the field no longer shows.
 */
@Component({
  selector: 'rx-prescription-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './prescription-filters.css',
  template: `
    <form class="rx-filters" (submit)="$event.preventDefault()">
      <label class="rx-field">
        Search
        <input type="search" [value]="search()" (input)="search.set(valueOf($event))" />
      </label>
      <label class="rx-field">
        Insurant ID
        <input
          type="text"
          [value]="insurantId()"
          [attr.aria-invalid]="insurantIdError() ? 'true' : null"
          aria-describedby="rx-insurant-id-error"
          (input)="edit('insurantId', $event)"
        />
        <span class="rx-error" id="rx-insurant-id-error">{{ insurantIdError() }}</span>
      </label>
      <label class="rx-field">
        Prescribed from
        <input type="date" [value]="from()" (input)="edit('from', $event)" />
      </label>
      <label class="rx-field">
        Prescribed to
        <input
          type="date"
          [value]="to()"
          [attr.aria-invalid]="toError() ? 'true' : null"
          aria-describedby="rx-to-error"
          (input)="edit('to', $event)"
        />
        <span class="rx-error" id="rx-to-error">{{ toError() }}</span>
      </label>
      <button type="button" class="rx-reset" (click)="clear()">Reset</button>
    </form>
  `,
})
export class PrescriptionFilters {
  readonly query = input.required<PrescriptionQuery>();
  readonly filterChange = output<FilterChange>();
  readonly reset = output<void>();
  readonly searchChange = output<string>();

  /** Values this component sent out, so the URL echo does not overwrite a draft. */
  private readonly sent: Partial<Record<FilterField, string>> = {};
  private readonly cancelSearch = new Subject<void>();

  protected readonly search = linkedSignal(() => this.query().q);
  protected readonly insurantId = this.draft('insurantId');
  protected readonly from = this.draft('from');
  protected readonly to = this.draft('to');

  protected readonly insurantIdError = computed(() =>
    this.insurantId() === '' || isInsurantId(this.insurantId())
      ? ''
      : 'Enter one letter followed by nine digits',
  );
  protected readonly toError = computed(() =>
    this.to() !== '' && this.from() !== '' && this.to() < this.from()
      ? 'Must not be before the from date'
      : '',
  );

  constructor() {
    this.debouncedSearch()
      .pipe(takeUntilDestroyed())
      .subscribe((text) => this.searchChange.emit(text));
  }

  protected valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected edit(field: FilterField, event: Event): void {
    this[field].set(this.valueOf(event));
    const changed = changedFilters(
      {
        insurantId: this.insurantIdError() ? '' : this.insurantId(),
        from: this.from(),
        to: this.toError() ? '' : this.to(),
      },
      this.query(),
    );
    if (Object.keys(changed).length > 0) {
      Object.assign(this.sent, changed);
      this.filterChange.emit(changed);
    }
  }

  protected clear(): void {
    this.cancelSearch.next();
    this.search.set('');
    this.insurantId.set('');
    this.from.set('');
    this.to.set('');
    this.reset.emit();
  }

  private draft(field: FilterField): WritableSignal<string> {
    return linkedSignal<string, string>({
      source: () => this.query()[field],
      computation: (url, previous) => {
        const ownEcho = this.sent[field] === url;
        delete this.sent[field];
        return previous !== undefined && ownEcho ? previous.value : url;
      },
    });
  }

  private debouncedSearch(): Observable<string> {
    return toObservable(this.search).pipe(
      switchMap((text) =>
        timer(SEARCH_DEBOUNCE_MS).pipe(
          map(() => text),
          takeUntil(this.cancelSearch),
        ),
      ),
      filter((text) => text !== this.query().q),
    );
  }
}
