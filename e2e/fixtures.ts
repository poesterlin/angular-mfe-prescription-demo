import { test as base } from '@playwright/test';

export interface MountOptions {
  /** Path the Remote is mounted under in the current project's target. */
  mountPath: string;
}

export const test = base.extend<MountOptions>({
  mountPath: ['/prescriptions', { option: true }],
});

export { expect } from '@playwright/test';
