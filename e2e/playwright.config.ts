import { defineConfig, devices } from '@playwright/test';
import type { MountOptions } from './fixtures';
import { REMOTE_URL, SHELL_URL } from './urls';

/**
 * Two targets for the same Remote tests (C-Q2): the Standalone Harness and the Shell.
 * Shell-only, harness-only and contract tests are pinned to one project each.
 */
export default defineConfig<MountOptions>({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'npm start',
      cwd: '../prescription',
      url: `${REMOTE_URL}/remoteEntry.json`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'npm start',
      cwd: '../shell',
      url: SHELL_URL,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'standalone',
      testMatch: ['remote/**/*.spec.ts', 'harness.spec.ts'],
      use: { baseURL: REMOTE_URL, mountPath: '/sandbox/prescriptions' },
    },
    {
      name: 'composed',
      testMatch: ['remote/**/*.spec.ts', 'shell/**/*.spec.ts'],
      use: { baseURL: SHELL_URL, mountPath: '/prescriptions' },
    },
    {
      name: 'contract',
      testMatch: ['contract.spec.ts'],
    },
  ],
});
