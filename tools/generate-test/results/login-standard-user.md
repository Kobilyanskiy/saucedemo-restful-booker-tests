# Login with standard_user lands on the product catalog

- Case: `login-standard-user`
- Generated: 2026-11-26T14:10:43.100Z
- Spec: `tests/ui/generated/login-standard-user.spec.ts`
- Status: **PASS**

## Input

### Login with standard_user lands on the product catalog

Type: positive (@smoke)

#### Preconditions
- The user is logged out (this test is about login itself).

#### Steps
1. Open the login page.
2. Log in as standard_user with the valid password.

#### Expected result
- The URL is /inventory.html.
- The page title is "Products".
- The catalog shows 6 products.

## Prompt summary

Sent to `claude -p --output-format text --tools "" --strict-mcp-config` on stdin, 11661 characters in total:

- CLAUDE.md sections: Writing UI tests (Sauce Demo), Test data and secrets, Tags (1573 chars)
- Page objects: CartPage, CheckoutCompletePage, CheckoutInformationPage, CheckoutOverviewPage, HeaderComponent, InventoryPage, LoginPage, ProductDetailsPage (2818 chars)
- Fixtures: fixtures/index.ts (1738 chars)
- Data/utils: data/booking.ts, data/checkout.ts, data/messages.ts, data/products.ts, data/users.ts, utils/price.ts (3438 chars)
- Test case: login-standard-user.md (358 chars)
- Output rules: one spec file only, imports from `../../../`, tags `@generated` + `@ui` + `@smoke`/`@negative`, listed API only

## Generated code

```ts
import { test, expect } from '../../../fixtures';
import { standardUser } from '../../../data/users';

test.describe('Login with standard_user lands on the product catalog', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test(
    'user can log in as standard_user and see the product catalog',
    { tag: ['@generated', '@smoke', '@ui'] },
    async ({ loginPage, inventoryPage, page }) => {
      await loginPage.goto();
      await loginPage.login(standardUser);

      await expect(page).toHaveURL(/\/inventory\.html$/);
      await expect(inventoryPage.title).toHaveText('Products');
      await expect(inventoryPage.productCards).toHaveCount(6);
    },
  );
});
```

## Run result

**Result:** PASS

**Command:** `npx playwright test tests/ui/generated/login-standard-user.spec.ts --project=ui`

<details><summary>Full output</summary>

```text
Running 2 tests using 1 worker

  ok 1 [ui-setup] › tests\ui\auth.setup.ts:5:1 › authenticate as standard_user (3.9s)
  ok 2 [ui] › tests\ui\generated\login-standard-user.spec.ts:7:3 › Login with standard_user lands on the product catalog › user can log in as standard_user and see the product catalog @generated @smoke @ui (1.0s)

  2 passed (9.0s)
```

</details>

## Manual fixes

Diff from the generated code above to the current `tests/ui/generated/login-standard-user.spec.ts`:

```diff
--- generated
+++ current
@@ -8,3 +8,3 @@ test.describe('Login with standard_user lands on the product catalog', () => {
     'user can log in as standard_user and see the product catalog',
-    { tag: ['@generated', '@smoke', '@ui'] },
+    { tag: ['@generated', '@ui'] },
     async ({ loginPage, inventoryPage, page }) => {
```

Why:
- Removed `@smoke`: the test duplicates the hand-written login smoke test in tests/ui/login.spec.ts.
