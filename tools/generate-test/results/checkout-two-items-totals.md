# Checkout of two items shows correct item total, tax and total

- Case: `checkout-two-items-totals`
- Generated: 2026-11-26T14:11:36.537Z
- Spec: `tests/ui/generated/checkout-two-items-totals.spec.ts`
- Status: **PASS**

## Input

### Checkout of two items shows correct item total, tax and total

Type: positive (@smoke)

#### Preconditions
- Logged in as standard_user, on the inventory page.

#### Steps
1. Read the prices of "Sauce Labs Backpack" and "Sauce Labs Bike Light" from the catalog.
2. Add both products to the cart.
3. Open the cart and start checkout.
4. Fill in first name, last name and postal code with the standard checkout data and continue.
5. On the overview page, read the tax.
6. Finish the order.

#### Expected result
- The cart badge shows 2 after step 2.
- The overview page (/checkout-step-two.html) lists exactly the two added products.
- "Item total" equals the sum of the two prices from step 1.
- "Tax" is a positive dollar amount.
- "Total" equals item total + tax.
- After finishing, the URL is /checkout-complete.html, the header says "Thank you for your order!"
  and the cart badge is gone.

## Prompt summary

Sent to `claude -p --output-format text --tools "" --strict-mcp-config` on stdin, 12213 characters in total:

- CLAUDE.md sections: Writing UI tests (Sauce Demo), Test data and secrets, Tags (1573 chars)
- Page objects: CartPage, CheckoutCompletePage, CheckoutInformationPage, CheckoutOverviewPage, HeaderComponent, InventoryPage, LoginPage, ProductDetailsPage (2818 chars)
- Fixtures: fixtures/index.ts (1738 chars)
- Data/utils: data/booking.ts, data/checkout.ts, data/messages.ts, data/products.ts, data/users.ts, utils/price.ts (3438 chars)
- Test case: checkout-two-items-totals.md (890 chars)
- Output rules: one spec file only, imports from `../../../`, tags `@generated` + `@ui` + `@smoke`/`@negative`, listed API only

## Generated code

```ts
import { test, expect } from '../../../fixtures';
import { products } from '../../../data/products';
import { checkoutInfo } from '../../../data/checkout';
import { messages } from '../../../data/messages';
import { toCents, formatCents } from '../../../utils/price';

test.describe('Checkout of two items shows correct item total, tax and total', () => {
  test(
    'user can check out two items and sees correct item total, tax and total',
    { tag: ['@generated', '@smoke', '@ui'] },
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
      await expect(checkoutOverviewPage.itemTotal).toContainText(
        formatCents(expectedItemTotalCents),
      );

      // Step 5: tax is a positive dollar amount (web-first check before reading it).
      await expect(checkoutOverviewPage.tax).toHaveText(/\$(?!0\.00\b)\d+\.\d{2}/);
      const taxCents = toCents(await checkoutOverviewPage.tax.innerText());
      expect(taxCents).toBeGreaterThan(0);

      // Total equals item total + tax.
      await expect(checkoutOverviewPage.total).toContainText(
        formatCents(expectedItemTotalCents + taxCents),
      );

      // Step 6: finish the order.
      await checkoutOverviewPage.finish();

      await expect(page).toHaveURL(/\/checkout-complete\.html$/);
      await expect(checkoutCompletePage.completeHeader).toHaveText(messages.orderComplete);
      await expect(header.cartBadge).toHaveCount(0);
    },
  );
});
```

## Run result

**Result:** PASS

**Command:** `npx playwright test tests/ui/generated/checkout-two-items-totals.spec.ts --project=ui`

<details><summary>Full output</summary>

```text
Running 2 tests using 1 worker

  ok 1 [ui-setup] › tests\ui\auth.setup.ts:5:1 › authenticate as standard_user (1.5s)
  ok 2 [ui] › tests\ui\generated\checkout-two-items-totals.spec.ts:8:3 › Checkout of two items shows correct item total, tax and total › user can check out two items and sees correct item total, tax and total @generated @smoke @ui (1.4s)

  2 passed (6.2s)
```

</details>

## Manual fixes

Diff from the generated code above to the current `tests/ui/generated/checkout-two-items-totals.spec.ts`:

```diff
--- generated
+++ current
@@ -9,3 +9,3 @@ test.describe('Checkout of two items shows correct item total, tax and total', (
     'user can check out two items and sees correct item total, tax and total',
-    { tag: ['@generated', '@smoke', '@ui'] },
+    { tag: ['@generated', '@ui'] }, // FIX: removed @smoke — duplicates the hand-written checkout smoke test
     async ({
@@ -51,8 +51,10 @@ test.describe('Checkout of two items shows correct item total, tax and total', (
       // Item total equals the sum of the catalog prices.
-      await expect(checkoutOverviewPage.itemTotal).toContainText(
-        formatCents(expectedItemTotalCents),
+      // FIX: exact match instead of toContainText
+      await expect(checkoutOverviewPage.itemTotal).toHaveText(
+        `Item total: ${formatCents(expectedItemTotalCents)}`,
       );
 
-      // Step 5: tax is a positive dollar amount (web-first check before reading it).
-      await expect(checkoutOverviewPage.tax).toHaveText(/\$(?!0\.00\b)\d+\.\d{2}/);
+      // Step 5: tax is a positive dollar amount.
+      // FIX: simple format check; "greater than zero" is asserted below
+      await expect(checkoutOverviewPage.tax).toHaveText(/^Tax: \$\d+\.\d{2}$/);
       const taxCents = toCents(await checkoutOverviewPage.tax.innerText());
@@ -61,4 +63,5 @@ test.describe('Checkout of two items shows correct item total, tax and total', (
       // Total equals item total + tax.
-      await expect(checkoutOverviewPage.total).toContainText(
-        formatCents(expectedItemTotalCents + taxCents),
+      // FIX: exact match instead of toContainText
+      await expect(checkoutOverviewPage.total).toHaveText(
+        `Total: ${formatCents(expectedItemTotalCents + taxCents)}`,
       );
@@ -73,2 +76,2 @@ test.describe('Checkout of two items shows correct item total, tax and total', (
   );
-});
+});
\ No newline at end of file
```

Why:
- Removed `@smoke`: the test duplicates the hand-written checkout smoke test in tests/ui/checkout.spec.ts.
- Item total and total: `toContainText` → exact `toHaveText`, because `toContainText` would also pass for a wrong, longer value (e.g. `$139.98` contains `$39.98`).
- Tax: the negative-lookahead regex → a simple format check `/^Tax: \$\d+\.\d{2}$/`, since "> 0" is asserted separately right after it.
