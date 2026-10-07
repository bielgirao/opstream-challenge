import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const MEDIA = !!process.env['MEDIA'];
/** Set to test a deployed app instead of a local dev server, e.g. E2E_BASE_URL=https://example.com */
const BASE_URL = process.env['E2E_BASE_URL'];

/**
 * End-to-end tests against the real app (with its in-browser mock backend).
 * Random failures are switched off per test through `?mockFailureRate=0`, and failure paths
 * are forced with `?mockSaveFailureRate=1`, so every run is deterministic.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL ?? `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: MEDIA
    ? // README screenshots and demo GIF, generated on demand: npm run media
      [{ name: 'media', use: { ...devices['Desktop Chrome'] }, grep: /@media/ }]
    : [
        {
          name: 'desktop',
          use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
          grepInvert: /@mobile|@media/,
        },
        { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
      ],
  webServer: BASE_URL
    ? undefined
    : {
        command: `npm start -- --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
      },
});
