import { test, expect } from '../../fixtures';
import { standardUser } from '../../data/users';
import { messages } from '../../data/messages';

test.describe('Login', () => {
  // These tests are about login itself, so they start without the saved session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test(
    'user can log in with valid credentials and see the product catalog',
    { tag: ['@smoke', '@ui'] },
    async ({ page, loginPage, inventoryPage }) => {
      await loginPage.login(standardUser);

      await expect(page).toHaveURL('/inventory.html');
      await expect(inventoryPage.title).toHaveText('Products');
      await expect(inventoryPage.productCards).toHaveCount(6);
    },
  );

  test(
    'user can log out and can no longer open the inventory',
    { tag: ['@smoke', '@ui'] },
    async ({ page, loginPage, inventoryPage, header }) => {
      await loginPage.login(standardUser);
      await expect(page).toHaveURL('/inventory.html');

      await header.logout();

      await expect(page).toHaveURL('/');
      await expect(loginPage.loginButton).toBeVisible();

      await inventoryPage.goto();

      await expect(loginPage.errorMessage).toHaveText(messages.inventoryRequiresLogin);
      await expect(inventoryPage.productCards).toHaveCount(0);
    },
  );
});
