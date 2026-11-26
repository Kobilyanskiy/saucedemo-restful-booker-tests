import { test, expect } from '../../fixtures';
import { lockedOutUser, standardUser, type User } from '../../data/users';
import { messages } from '../../data/messages';

const invalidLogins: { case: string; user: User; error: string }[] = [
  {
    case: 'a wrong password',
    user: { username: standardUser.username, password: 'wrong_password' },
    error: messages.login.wrongCredentials,
  },
  {
    case: 'an empty username',
    user: { username: '', password: standardUser.password },
    error: messages.login.usernameRequired,
  },
  {
    case: 'an empty password',
    user: { username: standardUser.username, password: '' },
    error: messages.login.passwordRequired,
  },
];

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

  test(
    'locked-out user cannot log in and sees the lockout message',
    { tag: ['@negative', '@ui'] },
    async ({ page, loginPage }) => {
      await loginPage.login(lockedOutUser);

      await expect(loginPage.errorMessage).toHaveText(messages.login.lockedOut);
      await expect(page).toHaveURL('/');
    },
  );

  for (const { case: caseName, user, error } of invalidLogins) {
    test(
      `user cannot log in with ${caseName}`,
      { tag: ['@negative', '@ui'] },
      async ({ page, loginPage }) => {
        await loginPage.login(user);

        await expect(loginPage.errorMessage).toHaveText(error);
        await expect(page).toHaveURL('/');
      },
    );
  }
});
