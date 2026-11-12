import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Fallback page for a Remote that failed to load (AC-E1). */
@Component({
  selector: 'shell-remote-unavailable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="shell-alert" role="alert">This Component is currently unavailable</p>`,
  styles: `
    .shell-alert {
      margin: 0;
      padding: 0.75rem 1rem;
      border: 1px solid #d9a400;
      background: #fff8e1;
    }
  `,
})
export class RemoteUnavailable {
}
