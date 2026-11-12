import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Prescription } from '../model/prescription';

/** Result count plus the table, or the empty state (AC-F1–F5). */
@Component({
  selector: 'rx-prescription-table',
  imports: [DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './prescription-table.css',
  template: `
    <p class="rx-count" aria-live="polite">
      {{ total() | number }} {{ total() === 1 ? 'result' : 'results' }}
    </p>
    @if (total() === 0) {
      <p class="rx-empty">No prescriptions match your search.</p>
    } @else {
      <table class="rx-table">
        <thead>
          <tr>
            <th scope="col">Medication</th>
            <th scope="col">Insurant</th>
            <th scope="col">Birth date</th>
            <th scope="col">Insurant ID</th>
            <th scope="col">Prescribed on</th>
          </tr>
        </thead>
        <tbody>
          @for (row of items(); track row.id) {
            <tr>
              <td>{{ row.medication }}</td>
              <td>{{ row.insurantName }}</td>
              <td>{{ row.insurantBirthDate | date: 'dd.MM.yyyy' }}</td>
              <td>{{ row.insurantId }}</td>
              <td>{{ row.prescribedOn | date: 'dd.MM.yyyy' }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class PrescriptionTable {
  readonly items = input.required<readonly Prescription[]>();
  readonly total = input.required<number>();
}
