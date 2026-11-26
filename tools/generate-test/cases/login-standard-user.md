# Login with standard_user lands on the product catalog

Type: positive (@smoke)

## Preconditions
- The user is logged out (this test is about login itself).

## Steps
1. Open the login page.
2. Log in as standard_user with the valid password.

## Expected result
- The URL is /inventory.html.
- The page title is "Products".
- The catalog shows 6 products.
