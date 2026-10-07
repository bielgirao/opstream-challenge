import { expect, test } from '@playwright/test';
import { SOFTWARE } from './support';

/**
 * Records the README demo (docs/demo.gif): npm run media
 * Paced for humans: short pauses between steps so each state is readable.
 */
test.use({
  viewport: { width: 1000, height: 600 },
  video: { mode: 'on', size: { width: 1000, height: 600 } },
});

test.describe('README demo @media', () => {
  test('record the request flow', async ({ page }) => {
    const pause = (ms = 900) => page.waitForTimeout(ms);
    const type = (selector: string, text: string) =>
      page.locator(selector).pressSequentially(text, { delay: 70 });

    await page.goto('/requests/new?mockFailureRate=0');
    await page.getByRole('button', { name: 'Software Request' }).waitFor();
    await pause(1200);
    await page.getByRole('button', { name: 'Hardware Request' }).hover();
    await pause(500);
    await page.getByRole('button', { name: 'Start' }).click();

    await page.getByRole('heading', { level: 1, name: 'Requested Item' }).waitFor();
    await pause();
    await page.getByRole('button', { name: 'Next' }).click();
    await pause(1400);

    await type(SOFTWARE.itemName, 'Figma');
    await type(SOFTWARE.quantity, '3abc');
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 6_000 });
    await pause(1200);
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByRole('heading', { level: 1, name: 'Vendor Information' }).waitFor();
    await pause(700);
    await type(SOFTWARE.vendorName, 'Figma Inc.');
    await page.getByRole('radio', { name: 'UK' }).check();
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 6_000 });
    await pause(1000);
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.getByRole('heading', { name: 'Request submitted' }).waitFor({ timeout: 8_000 });
    await pause(2500);

    await page.close();
    await page.video()?.saveAs('test-results/demo.webm');
  });
});
