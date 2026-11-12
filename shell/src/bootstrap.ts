import { bootstrapApplication } from '@angular/platform-browser';
import type { NativeFederationResult } from '@angular-architects/native-federation';
import { App } from './app/app';
import { createAppConfig } from './app/app.config';
import type { RemoteDefinition } from './app/remotes/remote-definition';
import { federationLoader } from './app/remotes/federation-loader';

export async function bootstrap(
  remotes: RemoteDefinition[],
  federation: NativeFederationResult,
): Promise<void> {
  await bootstrapApplication(App, createAppConfig(remotes, federationLoader(federation)));
}
