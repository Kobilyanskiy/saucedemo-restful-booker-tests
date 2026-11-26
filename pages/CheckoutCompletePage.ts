import type { Locator, Page } from '@playwright/test';

// "Checkout: Complete!"
export class CheckoutCompletePage {
  readonly completeHeader: Locator;

  constructor(page: Page) {
    this.completeHeader = page.getByRole('heading', { level: 2 });
  }
}
