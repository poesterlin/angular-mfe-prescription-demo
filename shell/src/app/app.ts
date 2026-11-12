import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { REMOTES } from './remotes/remotes.token';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'shell-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly remotes = inject(REMOTES);
}
