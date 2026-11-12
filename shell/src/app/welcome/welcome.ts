import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Minimal landing page at `/` (AC-S2). */
@Component({
  selector: 'shell-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Welcome</h1>`,
})
export class Welcome {}
