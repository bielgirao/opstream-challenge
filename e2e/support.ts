import { expect, Page } from '@playwright/test';

/** Field ids of the software schema (from the brief). */
export const SOFTWARE = {
  itemName: '#field-1758177604',
  quantity: '#field-75484637462',
  vendorName: '#field-4957463729',
  vendorLocation: 'field-8462736152',
  website: '#field-6482937561',
} as const;

/** Opens the chooser with deterministic mock behaviour and starts a Software request. */
export async function startSoftwareRequest(
  page: Page,
  query = 'mockFailureRate=0',
): Promise<string> {
  await page.goto(`/requests/new?${query}`);
  await page.getByRole('button', { name: 'Software Request' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Requested Item' })).toBeVisible();
  return new URL(page.url()).pathname;
}

export async function fillRequestedItem(page: Page, item = 'Figma', quantity = '3') {
  await page.locator(SOFTWARE.itemName).fill(item);
  await page.locator(SOFTWARE.quantity).pressSequentially(quantity);
}

export async function fillVendorInfo(page: Page, vendor = 'Figma Inc.', location = 'UK') {
  await page.locator(SOFTWARE.vendorName).fill(vendor);
  await page.getByRole('radio', { name: location }).check();
}

export const saveIndicator = (page: Page) => page.locator('ui-save-indicator');
