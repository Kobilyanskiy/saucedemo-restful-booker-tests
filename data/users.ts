// Public Sauce Demo credentials; override via environment variables if needed.
const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

export interface User {
  username: string;
  password: string;
}

export const standardUser: User = {
  username: 'standard_user',
  password: PASSWORD,
};

// Negative tests only.
export const lockedOutUser: User = {
  username: 'locked_out_user',
  password: PASSWORD,
};

// Written by tests/ui/auth.setup.ts, used as storageState by the `ui` project.
export const STANDARD_USER_STORAGE_STATE = '.auth/standard_user.json';
