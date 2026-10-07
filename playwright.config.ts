import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const SCREENSHOTS = !!process.env['SCREENSHOTS'];

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
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: SCREENSHOTS
    ? // README screenshots, generated on demand: npm run screenshots
      [{ name: 'screenshots', use: { ...devices['Desktop Chrome'] }, grep: /@screenshots/ }]
    : [
        {
          name: 'desktop',
          use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
          grepInvert: /@mobile|@screenshots/,
        },
        { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
      ],
  webServer: {
    command: `npm start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
