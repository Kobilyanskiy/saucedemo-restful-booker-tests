import { test as base, expect } from '@playwright/test';
import { apiCredentials } from '../data/booking';

type ApiFixtures = {
  // A fresh token from POST /auth for the admin user.
  authToken: string;
};

export const test = base.extend<ApiFixtures>({
  authToken: async ({ request }, use) => {
    const response = await request.post('/auth', { data: apiCredentials });
    // Precondition guard: /auth also answers 200 for bad credentials (BUG-API-01),
    // so the status alone does not prove a token was issued.
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ token: expect.stringMatching(/^\S+$/) });
    await use(body.token);
  },
});

// Restful Booker expects the token as a cookie on PUT, PATCH and DELETE.
export function authHeader(token: string): Record<string, string> {
  return { Cookie: `token=${token}` };
}

export { expect } from '@playwright/test';
