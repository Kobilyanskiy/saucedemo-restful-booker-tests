import type { Locator, Page } from '@playwright/test';

export class ProductDetailsPage {
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly backToProductsButton: Locator;

  constructor(page: Page) {
    this.name = page.getByTestId('inventory-item-name');
    this.description = page.getByTestId('inventory-item-desc');
    this.price = page.getByTestId('inventory-item-price');
    this.backToProductsButton = page.getByRole('button', { name: 'Back to products' });
  }

  async backToProducts(): Promise<void> {
    await this.backToProductsButton.click();
  }
}
