import { test, expect } from '../../../fixtures';
import { toCents, formatCents } from '../../../utils/price'; // FIX: formatCents for the expected texts

test.describe('Sort products by price high to low', () => {
  test(
    'user can sort products by price high to low',
    { tag: ['@generated', '@ui'] }, // FIX: removed @smoke — duplicates the hand-written sorting test
    async ({ inventoryPage }) => {
      await inventoryPage.goto();
      await expect(inventoryPage.title).toBeVisible();

      // Step 1: start from a different order so the result is not the default list.
      await inventoryPage.sortBy('lohi');
      await expect(inventoryPage.activeSortOption).toHaveText('Price (low to high)');

      // Step 2: read all product prices from the page.
      await expect(inventoryPage.productPrices.first()).toBeVisible();
      const priceTexts = await inventoryPage.productPrices.allTextContents();
      const pricesInCents = priceTexts.map(toCents);
      expect(pricesInCents.length).toBeGreaterThan(1);

      const expectedHighToLow = [...pricesInCents].sort((a, b) => b - a);

      // Step 3: sort by price high to low.
      await inventoryPage.sortBy('hilo');

      // Expected: active sort option is "Price (high to low)".
      await expect(inventoryPage.activeSortOption).toHaveText('Price (high to low)');

      // Expected: the whole list of prices matches the sorted copy.
      // FIX: web-first toHaveText on the locator instead of expect.poll over allTextContents()
      await expect(inventoryPage.productPrices).toHaveText(expectedHighToLow.map(formatCents));
    },
  );
});