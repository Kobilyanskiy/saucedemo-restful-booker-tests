import { test, expect } from '../../../fixtures';
import { products } from '../../../data/products';
import { checkoutInfo } from '../../../data/checkout';
import { messages } from '../../../data/messages';
import { toCents, formatCents } from '../../../utils/price';

test.describe('Checkout of two items shows correct item total, tax and total', () => {
  test(
    'user can check out two items and sees correct item total, tax and total',
    { tag: ['@generated', '@ui'] }, // FIX: removed @smoke — duplicates the hand-written checkout smoke test
    async ({
      page,
      header,
      inventoryPage,
      cartPage,
      checkoutInformationPage,
      checkoutOverviewPage,
      checkoutCompletePage,
    }) => {
      await inventoryPage.goto();

      // Step 1: read prices from the catalog (prices are always taken from the page).
      const backpackPriceCents = toCents(
        await inventoryPage.productPrice(products.backpack).innerText(),
      );
      const bikeLightPriceCents = toCents(
        await inventoryPage.productPrice(products.bikeLight).innerText(),
      );
      const expectedItemTotalCents = backpackPriceCents + bikeLightPriceCents;

      // Step 2: add both products to the cart.
      await inventoryPage.addToCart(products.backpack);
      await inventoryPage.addToCart(products.bikeLight);
      await expect(header.cartBadge).toHaveText('2');

      // Step 3: open the cart and start checkout.
      await header.openCart();
      await cartPage.checkout();

      // Step 4: fill in checkout information and continue.
      await checkoutInformationPage.fill(checkoutInfo);
      await checkoutInformationPage.continue();

      // Overview lists exactly the two added products.
      await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
      await expect(checkoutOverviewPage.itemNames).toHaveText([
        products.backpack,
        products.bikeLight,
      ]);

      // Item total equals the sum of the catalog prices.
      // FIX: exact match instead of toContainText
      await expect(checkoutOverviewPage.itemTotal).toHaveText(
        `Item total: ${formatCents(expectedItemTotalCents)}`,
      );

      // Step 5: tax is a positive dollar amount.
      // FIX: simple format check; "greater than zero" is asserted below
      await expect(checkoutOverviewPage.tax).toHaveText(/^Tax: \$\d+\.\d{2}$/);
      const taxCents = toCents(await checkoutOverviewPage.tax.innerText());
      expect(taxCents).toBeGreaterThan(0);

      // Total equals item total + tax.
      // FIX: exact match instead of toContainText
      await expect(checkoutOverviewPage.total).toHaveText(
        `Total: ${formatCents(expectedItemTotalCents + taxCents)}`,
      );

      // Step 6: finish the order.
      await checkoutOverviewPage.finish();

      await expect(page).toHaveURL(/\/checkout-complete\.html$/);
      await expect(checkoutCompletePage.completeHeader).toHaveText(messages.orderComplete);
      await expect(header.cartBadge).toHaveCount(0);
    },
  );
});