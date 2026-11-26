import type { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly rows: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemQuantities = page.getByTestId('item-quantity');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  row(name: string): Locator {
    return this.rows.filter({
      has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }),
    });
  }

  async removeItem(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: 'Remove' }).click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
