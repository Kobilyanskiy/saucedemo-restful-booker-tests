import { test, expect } from '../../fixtures';
import { products } from '../../data/products';

test.describe('Catalog', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test(
    'user can open product details from the catalog',
    { tag: ['@smoke', '@ui'] },
    async ({ page, inventoryPage, productDetailsPage }) => {
      const name = products.backpack;
      // Expected details are taken from the catalog card the user clicks.
      const description = await inventoryPage.productDescription(name).innerText();
      const price = await inventoryPage.productPrice(name).innerText();

      await inventoryPage.openProductDetails(name);

      await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
      await expect(productDetailsPage.name).toHaveText(name);
      await expect(productDetailsPage.description).toHaveText(description);
      await expect(productDetailsPage.price).toHaveText(price);

      await productDetailsPage.backToProducts();

      await expect(page).toHaveURL('/inventory.html');
    },
  );
});
