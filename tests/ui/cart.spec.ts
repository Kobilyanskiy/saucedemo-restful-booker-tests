import { test, expect } from '../../fixtures';
import { products } from '../../data/products';

test.describe('Cart', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test(
    'user can add products to the cart and remove one from the cart',
    { tag: ['@smoke', '@ui'] },
    async ({ page, inventoryPage, cartPage, header }) => {
      const added = [products.backpack, products.bikeLight];
      const prices: string[] = [];
      for (const name of added) {
        prices.push(await inventoryPage.productPrice(name).innerText());
        await inventoryPage.addToCart(name);
        await expect(inventoryPage.removeButton(name)).toBeVisible();
      }

      await expect(header.cartBadge).toHaveText('2');

      await header.openCart();

      await expect(page).toHaveURL('/cart.html');
      await expect(cartPage.rows).toHaveCount(2);
      await expect(cartPage.itemNames).toHaveText(added);
      await expect(cartPage.itemPrices).toHaveText(prices);
      await expect(cartPage.itemQuantities).toHaveText(['1', '1']);

      await cartPage.removeItem(products.bikeLight);

      await expect(cartPage.rows).toHaveCount(1);
      await expect(cartPage.itemNames).toHaveText([products.backpack]);
      await expect(header.cartBadge).toHaveText('1');
    },
  );
});
