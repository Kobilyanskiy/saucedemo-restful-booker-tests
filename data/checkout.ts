export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

// Sauce Demo does not persist checkout info, so static values are enough.
export const checkoutInfo: CheckoutInfo = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '12345',
};
