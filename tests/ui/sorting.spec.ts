import { test, expect } from '../../fixtures';
import type { SortOption } from '../../pages/InventoryPage';
import { toCents } from '../../utils/price';

type SortCase = {
  option: SortOption;
  label: string;
  // Applied first so the list is not already in the expected order (default is A to Z).
  startFrom: SortOption;
  by: 'name' | 'price';
  direction: 'asc' | 'desc';
};

const sortCases: SortCase[] = [
  { option: 'az', label: 'Name (A to Z)', startFrom: 'za', by: 'name', direction: 'asc' },
  { option: 'za', label: 'Name (Z to A)', startFrom: 'az', by: 'name', direction: 'desc' },
  { option: 'lohi', label: 'Price (low to high)', startFrom: 'hilo', by: 'price', direction: 'asc' },
  { option: 'hilo', label: 'Price (high to low)', startFrom: 'lohi', by: 'price', direction: 'desc' },
];

test.describe('Sorting', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  for (const { option, label, startFrom, by, direction } of sortCases) {
    test(
      `user can sort products by ${label}`,
      { tag: ['@smoke', '@ui'] },
      async ({ inventoryPage }) => {
        await inventoryPage.sortBy(startFrom);
        const sign = direction === 'asc' ? 1 : -1;

        if (by === 'name') {
          const names = await inventoryPage.productNames.allInnerTexts();
          const expected = [...names].sort((a, b) => sign * a.localeCompare(b));

          await inventoryPage.sortBy(option);

          await expect(inventoryPage.activeSortOption).toHaveText(label);
          await expect(inventoryPage.productNames).toHaveText(expected);
        } else {
          // Prices only: two products share $15.99, so their relative name order is not defined.
          const prices = await inventoryPage.productPrices.allInnerTexts();
          const expected = [...prices].sort((a, b) => sign * (toCents(a) - toCents(b)));

          await inventoryPage.sortBy(option);

          await expect(inventoryPage.activeSortOption).toHaveText(label);
          await expect(inventoryPage.productPrices).toHaveText(expected);
        }
      },
    );
  }
});
