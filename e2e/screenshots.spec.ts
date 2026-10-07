import { expect, test } from '@playwright/test';
import { fillRequestedItem, fillVendorInfo, saveIndicator, startSoftwareRequest } from './support';

/** Regenerates the README screenshots: npm run media */
test.describe('README screenshots @media', () => {
  test.use({ viewport: { width: 1200, height: 760 } });
  const shot = (name: string) => `docs/screenshots/${name}.png`;

  test('capture the flow', async ({ page }) => {
    await page.goto('/requests/new?mockFailureRate=0');
    await page.getByRole('button', { name: 'Software Request' }).waitFor();
    await page.screenshot({ path: shot('1-chooser') });

    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByText('This field is required').first().waitFor();
    await page.screenshot({ path: shot('2-validation') });

    await fillRequestedItem(page);
    await page.getByRole('button', { name: 'Next' }).click();
    await fillVendorInfo(page);
    await expect(saveIndicator(page)).toHaveText('Saving…');
    await page.screenshot({ path: shot('3-autosave') });

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByRole('heading', { name: 'Request submitted' }).waitFor({ timeout: 8_000 });
    await page.screenshot({ path: shot('4-summary') });
  });

  test('capture a failed save', async ({ page }) => {
    await startSoftwareRequest(page, 'mockFailureRate=0&mockSaveFailureRate=1');
    await fillRequestedItem(page);
    await expect(saveIndicator(page)).toContainText("Couldn't save", { timeout: 10_000 });
    await page.screenshot({ path: shot('5-save-failed') });
  });
});
