import { expect, test } from '@playwright/test';
import { fillRequestedItem, fillVendorInfo, saveIndicator, startSoftwareRequest } from './support';

test.describe('failure paths', () => {
  test('a failed schema load offers a retry', async ({ page }) => {
    await page.goto('/requests/new?mockFailureRate=1');
    await expect(page.getByRole('alert')).toContainText("We couldn't load the request types");
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('autosave retries, then gives up and blocks submit', async ({ page }) => {
    await startSoftwareRequest(page, 'mockFailureRate=0&mockSaveFailureRate=1');
    await fillRequestedItem(page);

    await expect(saveIndicator(page)).toHaveText('Error – retrying…', { timeout: 6_000 });
    await expect(saveIndicator(page)).toContainText("Couldn't save", { timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Requested Item/ })).toContainText('(not saved)');

    await page.getByRole('button', { name: 'Next' }).click();
    await fillVendorInfo(page);
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText("Some answers weren't saved")).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/sections\/vendor-info$/);
  });

  test('offline answers are saved when the connection comes back', async ({ page, context }) => {
    await startSoftwareRequest(page);
    await context.setOffline(true);
    await fillRequestedItem(page);

    await expect(page.getByText("You're offline")).toBeVisible();
    await expect(saveIndicator(page)).toHaveText('Offline – will save when you reconnect', {
      timeout: 10_000,
    });

    await context.setOffline(false);
    await expect(saveIndicator(page)).toHaveText('Saved', { timeout: 6_000 });
    await expect(page.getByText("You're offline")).toBeHidden();
  });
});
