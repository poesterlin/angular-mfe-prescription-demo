import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Container for the Prescriptions view. */
@Component({
  selector: 'rx-prescription-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 class="rx-title">Prescriptions</h1>`,
})
export class PrescriptionPage {}
