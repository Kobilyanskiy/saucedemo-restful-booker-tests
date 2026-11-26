import type { Locator, Page } from '@playwright/test';

// Checkout step two: "Checkout: Overview".
export class CheckoutOverviewPage {
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemTotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemTotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.finishButton = page.getByRole('button', { name: 'Finish' });
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
