import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Harness page for unknown paths. */
@Component({
  selector: 'rx-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Not found</h1>`,
})
export class NotFound {}
