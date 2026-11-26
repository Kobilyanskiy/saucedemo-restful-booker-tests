// Exact UI texts observed on www.saucedemo.com.
export const messages = {
  inventoryRequiresLogin:
    "Epic sadface: You can only access '/inventory.html' when you are logged in.",
  orderComplete: 'Thank you for your order!',
  login: {
    lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
    wrongCredentials:
      'Epic sadface: Username and password do not match any user in this service',
    usernameRequired: 'Epic sadface: Username is required',
    passwordRequired: 'Epic sadface: Password is required',
  },
  checkout: {
    firstNameRequired: 'Error: First Name is required',
    lastNameRequired: 'Error: Last Name is required',
    postalCodeRequired: 'Error: Postal Code is required',
  },
} as const;
