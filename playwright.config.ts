import { defineConfig, devices } from '@playwright/test';
import { STANDARD_USER_STORAGE_STATE } from './data/users';

export default defineConfig({
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      // Logs in once through the UI and saves the session for the `ui` project.
      name: 'ui-setup',
      testDir: './tests/ui',
      testMatch: /auth\.setup\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
      },
    },
    {
      name: 'ui',
      testDir: './tests/ui',
      dependencies: ['ui-setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        storageState: STANDARD_USER_STORAGE_STATE,
      },
    },
    {
      // No browser: API specs use only the `request` fixture.
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'https://restful-booker.herokuapp.com',
      },
    },
  ],
});
