import { test as setup, expect } from '../../fixtures';
import { standardUser, STANDARD_USER_STORAGE_STATE } from '../../data/users';

setup('authenticate as standard_user', { tag: ['@smoke', '@ui'] }, async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login(standardUser);
  await expect(page).toHaveURL('/inventory.html');

  await page.context().storageState({ path: STANDARD_USER_STORAGE_STATE });
});
