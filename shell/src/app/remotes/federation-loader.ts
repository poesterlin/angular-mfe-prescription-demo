import type { Routes } from '@angular/router';
import type { NativeFederationResult } from '@angular-architects/native-federation';
import type { RemoteDefinition } from './remote-definition';
import type { RemoteLoader } from './remote-routes';

interface RoutesModule {
  default: Routes;
}

/** Registers a Remote on first use, then loads its exposed `Routes` (C-A4). */
export function federationLoader(federation: NativeFederationResult): RemoteLoader {
  return (remote: RemoteDefinition) =>
    federation
      .initRemoteEntry(remote.remoteEntry, remote.name)
      .then((fed) => fed.loadRemoteModule<RoutesModule>(remote.name, remote.exposedModule))
      .then((module) => module.default);
}
