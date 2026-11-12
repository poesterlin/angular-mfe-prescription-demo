import type { Routes } from '@angular/router';
import type { RemoteDefinition } from './remote-definition';

/** Loads the `Routes` a Remote exposes. */
export type RemoteLoader = (remote: RemoteDefinition) => Promise<Routes>;

/** Shown in place of a Remote that cannot be loaded (AC-E1). */
function unavailableRoutes(): Routes {
  return [
    {
      path: '**',
      title: 'Unavailable',
      loadComponent: () => import('./remote-unavailable').then((m) => m.RemoteUnavailable),
    },
  ];
}

/** One lazy route per Remote, mounted at its manifest route path (AC-S4). */
export function buildRemoteRoutes(remotes: RemoteDefinition[], load: RemoteLoader): Routes {
  return remotes.map((remote) => ({
    path: remote.routePath,
    loadChildren: () =>
      load(remote).catch((error: unknown) => {
        console.error(`Remote "${remote.name}" could not be loaded.`, error);
        return unavailableRoutes();
      }),
  }));
}
