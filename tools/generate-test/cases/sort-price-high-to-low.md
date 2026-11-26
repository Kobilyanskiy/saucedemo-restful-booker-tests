# Sort products by price high to low

Type: positive (@smoke)

## Preconditions
- Logged in as standard_user, on the inventory page.

## Steps
1. Sort the products by "Price (low to high)" so the list does not start in the expected order.
2. Read all product prices shown on the page.
3. Sort the products by "Price (high to low)".

## Expected result
- The active sort option shows "Price (high to low)".
- The full list of prices on the page equals the prices from step 2 sorted from highest to lowest
  (compare the whole list, not only the first item; compare prices as numbers in cents).
