import { test as setup, expect } from '../../fixtures';
import { standardUser, STANDARD_USER_STORAGE_STATE } from '../../data/users';

// No tags: dependency projects run whenever a dependent `ui` test is selected, regardless of --grep.
setup('authenticate as standard_user', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login(standardUser);
  await expect(page).toHaveURL('/inventory.html');

  await page.context().storageState({ path: STANDARD_USER_STORAGE_STATE });
});
