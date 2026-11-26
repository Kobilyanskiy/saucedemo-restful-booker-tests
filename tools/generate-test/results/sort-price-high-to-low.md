# Sort products by price high to low

- Case: `sort-price-high-to-low`
- Generated: 2026-11-26T14:11:07.824Z
- Spec: `tests/ui/generated/sort-price-high-to-low.spec.ts`
- Status: **PASS**

## Input

### Sort products by price high to low

Type: positive (@smoke)

#### Preconditions
- Logged in as standard_user, on the inventory page.

#### Steps
1. Sort the products by "Price (low to high)" so the list does not start in the expected order.
2. Read all product prices shown on the page.
3. Sort the products by "Price (high to low)".

#### Expected result
- The active sort option shows "Price (high to low)".
- The full list of prices on the page equals the prices from step 2 sorted from highest to lowest
  (compare the whole list, not only the first item; compare prices as numbers in cents).

## Prompt summary

Sent to `claude -p --output-format text --tools "" --strict-mcp-config` on stdin, 11882 characters in total:

- CLAUDE.md sections: Writing UI tests (Sauce Demo), Test data and secrets, Tags (1573 chars)
- Page objects: CartPage, CheckoutCompletePage, CheckoutInformationPage, CheckoutOverviewPage, HeaderComponent, InventoryPage, LoginPage, ProductDetailsPage (2818 chars)
- Fixtures: fixtures/index.ts (1738 chars)
- Data/utils: data/booking.ts, data/checkout.ts, data/messages.ts, data/products.ts, data/users.ts, utils/price.ts (3438 chars)
- Test case: sort-price-high-to-low.md (592 chars)
- Output rules: one spec file only, imports from `../../../`, tags `@generated` + `@ui` + `@smoke`/`@negative`, listed API only

## Generated code

```ts
import { test, expect } from '../../../fixtures';
import { toCents } from '../../../utils/price';

test.describe('Sort products by price high to low', () => {
  test(
    'user can sort products by price high to low',
    { tag: ['@generated', '@smoke', '@ui'] },
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

      // Expected: the whole list of prices matches the sorted copy, compared in cents.
      await expect(inventoryPage.productPrices).toHaveCount(pricesInCents.length);
      await expect
        .poll(async () => (await inventoryPage.productPrices.allTextContents()).map(toCents))
        .toEqual(expectedHighToLow);
    },
  );
});
```

## Run result

**Result:** PASS

**Command:** `npx playwright test tests/ui/generated/sort-price-high-to-low.spec.ts --project=ui`

<details><summary>Full output</summary>

```text
Running 2 tests using 1 worker

  ok 1 [ui-setup] › tests\ui\auth.setup.ts:5:1 › authenticate as standard_user (1.5s)
  ok 2 [ui] › tests\ui\generated\sort-price-high-to-low.spec.ts:5:3 › Sort products by price high to low › user can sort products by price high to low @generated @smoke @ui (1.3s)

  2 passed (5.9s)
```

</details>

## Manual fixes

Diff from the generated code above to the current `tests/ui/generated/sort-price-high-to-low.spec.ts`:

```diff
--- generated
+++ current
@@ -1,3 +1,3 @@
 import { test, expect } from '../../../fixtures';
-import { toCents } from '../../../utils/price';
+import { toCents, formatCents } from '../../../utils/price'; // FIX: formatCents for the expected texts
 
@@ -6,3 +6,3 @@ test.describe('Sort products by price high to low', () => {
     'user can sort products by price high to low',
-    { tag: ['@generated', '@smoke', '@ui'] },
+    { tag: ['@generated', '@ui'] }, // FIX: removed @smoke — duplicates the hand-written sorting test
     async ({ inventoryPage }) => {
@@ -29,9 +29,7 @@ test.describe('Sort products by price high to low', () => {
 
-      // Expected: the whole list of prices matches the sorted copy, compared in cents.
-      await expect(inventoryPage.productPrices).toHaveCount(pricesInCents.length);
-      await expect
-        .poll(async () => (await inventoryPage.productPrices.allTextContents()).map(toCents))
-        .toEqual(expectedHighToLow);
+      // Expected: the whole list of prices matches the sorted copy.
+      // FIX: web-first toHaveText on the locator instead of expect.poll over allTextContents()
+      await expect(inventoryPage.productPrices).toHaveText(expectedHighToLow.map(formatCents));
     },
   );
-});
+});
\ No newline at end of file
```

Why:
- Removed `@smoke`: the test duplicates the hand-written sorting smoke test in tests/ui/sorting.spec.ts.
- `expect.poll` over `allTextContents()` → web-first `toHaveText(array)` on the locator (with `formatCents` for the expected texts), as CLAUDE.md requires; `toHaveText(array)` also checks the count, so the separate `toHaveCount` was dropped.
