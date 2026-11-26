# Checkout of two items shows correct item total, tax and total

Type: positive (@smoke)

## Preconditions
- Logged in as standard_user, on the inventory page.

## Steps
1. Read the prices of "Sauce Labs Backpack" and "Sauce Labs Bike Light" from the catalog.
2. Add both products to the cart.
3. Open the cart and start checkout.
4. Fill in first name, last name and postal code with the standard checkout data and continue.
5. On the overview page, read the tax.
6. Finish the order.

## Expected result
- The cart badge shows 2 after step 2.
- The overview page (/checkout-step-two.html) lists exactly the two added products.
- "Item total" equals the sum of the two prices from step 1.
- "Tax" is a positive dollar amount.
- "Total" equals item total + tax.
- After finishing, the URL is /checkout-complete.html, the header says "Thank you for your order!"
  and the cart badge is gone.
