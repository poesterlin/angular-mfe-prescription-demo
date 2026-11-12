import { InjectionToken } from '@angular/core';
import type { RemoteDefinition } from './remote-definition';

/** The Remotes from the Remote Manifest; drives the navigation (AC-S3). */
export const REMOTES = new InjectionToken<readonly RemoteDefinition[]>('REMOTES', {
  factory: () => [],
});
