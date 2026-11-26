import { test, expect } from '../../../fixtures';
import { standardUser } from '../../../data/users';

test.describe('Login with standard_user lands on the product catalog', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test(
    'user can log in as standard_user and see the product catalog',
    { tag: ['@generated', '@ui'] },
    async ({ loginPage, inventoryPage, page }) => {
      await loginPage.goto();
      await loginPage.login(standardUser);

      await expect(page).toHaveURL(/\/inventory\.html$/);
      await expect(inventoryPage.title).toHaveText('Products');
      await expect(inventoryPage.productCards).toHaveCount(6);
    },
  );
});
