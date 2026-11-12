import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { buildRoutes } from './app.routes';
import type { RemoteDefinition } from './remotes/remote-definition';
import { buildRemoteRoutes, type RemoteLoader } from './remotes/remote-routes';
import { REMOTES } from './remotes/remotes.token';

export function createAppConfig(
  remotes: RemoteDefinition[],
  load: RemoteLoader,
): ApplicationConfig {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(buildRoutes(buildRemoteRoutes(remotes, load))),
      { provide: REMOTES, useValue: remotes },
    ],
  };
}
