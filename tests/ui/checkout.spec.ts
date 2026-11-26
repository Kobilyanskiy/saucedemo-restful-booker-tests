import { test, expect } from '../../fixtures';
import { products } from '../../data/products';
import { checkoutInfo } from '../../data/checkout';
import { messages } from '../../data/messages';
import { formatCents, toCents } from '../../utils/price';

test.describe('Checkout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test(
    'user can complete checkout and sees the correct item total, tax and total',
    { tag: ['@smoke', '@ui'] },
    async ({
      page,
      inventoryPage,
      header,
      cartPage,
      checkoutInformationPage,
      checkoutOverviewPage,
      checkoutCompletePage,
    }) => {
      const added = [products.backpack, products.bikeLight];
      let itemTotalCents = 0;
      for (const name of added) {
        itemTotalCents += toCents(await inventoryPage.productPrice(name).innerText());
        await inventoryPage.addToCart(name);
      }
      await expect(header.cartBadge).toHaveText(String(added.length));

      await header.openCart();
      await cartPage.checkout();
      await checkoutInformationPage.fill(checkoutInfo);
      await checkoutInformationPage.continue();

      await expect(page).toHaveURL('/checkout-step-two.html');
      await expect(checkoutOverviewPage.itemNames).toHaveText(added);
      await expect(checkoutOverviewPage.itemTotal).toHaveText(
        `Item total: ${formatCents(itemTotalCents)}`,
      );

      await expect(checkoutOverviewPage.tax).toHaveText(/^Tax: \$\d+\.\d{2}$/);
      const taxCents = toCents(await checkoutOverviewPage.tax.innerText());
      expect(taxCents).toBeGreaterThan(0);
      await expect(checkoutOverviewPage.total).toHaveText(
        `Total: ${formatCents(itemTotalCents + taxCents)}`,
      );

      await checkoutOverviewPage.finish();

      await expect(page).toHaveURL('/checkout-complete.html');
      await expect(checkoutCompletePage.completeHeader).toHaveText(messages.orderComplete);
      await expect(header.cartBadge).toHaveCount(0);
    },
  );
});
