import { expect, test } from '@playwright/test';
import {
  fillRequestedItem,
  fillVendorInfo,
  saveIndicator,
  SOFTWARE,
  startSoftwareRequest,
} from './support';

test.describe('request flow', () => {
  test('chooser lists both schemas with the first one selected', async ({ page }) => {
    await page.goto('/?mockFailureRate=0');
    await expect(page).toHaveURL(/\/requests\/new/);
    await expect(page.getByRole('button', { name: 'Software Request' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Hardware Request' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('Next is blocked on invalid input, with errors and focus on the first invalid field', async ({
    page,
  }) => {
    const url = await startSoftwareRequest(page);
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('This field is required')).toHaveCount(2);
    await expect(page.locator(SOFTWARE.itemName)).toBeFocused();
    await expect(page.locator(SOFTWARE.itemName)).toHaveAttribute('aria-invalid', 'true');
    expect(new URL(page.url()).pathname).toBe(url);
  });

  test('number fields only accept whole numbers', async ({ page }) => {
    await startSoftwareRequest(page);
    await page.locator(SOFTWARE.quantity).pressSequentially('-1e2.5abc');
    await expect(page.locator(SOFTWARE.quantity)).toHaveValue('125');
  });

  test('answers are normalised when leaving the field', async ({ page }) => {
    await startSoftwareRequest(page);
    await page.locator(SOFTWARE.itemName).fill('  Figma  ');
    await page.locator(SOFTWARE.quantity).pressSequentially('007');
    await page.locator(SOFTWARE.quantity).blur();

    await expect(page.locator(SOFTWARE.itemName)).toHaveValue('Figma');
    await expect(page.locator(SOFTWARE.quantity)).toHaveValue('7');
  });

  test('answers autosave and survive a refresh', async ({ page }) => {
    const url = await startSoftwareRequest(page);
    await fillRequestedItem(page);
    await expect(saveIndicator(page)).toHaveText('Saving…');
    await expect(saveIndicator(page)).toHaveText('Saved', { timeout: 6_000 });

    await page.goto(`${url}?mockFailureRate=0`);
    await expect(page.locator(SOFTWARE.itemName)).toHaveValue('Figma');
    await expect(page.locator(SOFTWARE.quantity)).toHaveValue('3');
  });

  test('a later section cannot be opened while an earlier one is invalid', async ({ page }) => {
    const url = await startSoftwareRequest(page);
    await page.goto(url.replace('requested-item', 'vendor-info') + '?mockFailureRate=0');
    await expect(page).toHaveURL(/\/sections\/requested-item/);
    await expect(page.getByRole('link', { name: /Vendor Information/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('a valid request is submitted and summarised', async ({ page }) => {
    await startSoftwareRequest(page);
    await fillRequestedItem(page, 'Figma', '1500');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Vendor Information' })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    await fillVendorInfo(page);
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page).toHaveURL(/\/summary$/, { timeout: 8_000 });
    await expect(page.getByRole('heading', { name: 'Request submitted' })).toBeVisible();
    const rows = page.locator('.summary__row');
    await expect(rows).toHaveText([
      /Item Name\s*Figma/,
      /Quantity\s*1,500/,
      /Vendor Name\s*Figma Inc\./,
      /Vendor Location\s*UK/,
      /Website\s*not answered/,
    ]);

    // A submitted request cannot be edited again through the browser history.
    await page.goBack();
    await expect(page).toHaveURL(/\/summary$/);

    await page.getByRole('button', { name: 'Create New Request' }).click();
    await expect(page).toHaveURL(/\/requests\/new$/);
  });

  test('the layout works on a phone @mobile', async ({ page }) => {
    await startSoftwareRequest(page);
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('This field is required')).toHaveCount(2);
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows).toBe(false);
  });
});
