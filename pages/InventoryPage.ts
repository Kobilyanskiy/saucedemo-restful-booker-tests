import type { Locator, Page } from '@playwright/test';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly title: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly sortSelect: Locator;
  readonly activeSortOption: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.productCards = page.getByTestId('inventory-item');
    this.productNames = page.getByTestId('inventory-item-name');
    this.productPrices = page.getByTestId('inventory-item-price');
    this.sortSelect = page.getByRole('combobox', { name: 'Sort products' });
    this.activeSortOption = page.getByTestId('active-option');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  productCard(name: string): Locator {
    return this.productCards.filter({
      has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }),
    });
  }

  productPrice(name: string): Locator {
    return this.productCard(name).getByTestId('inventory-item-price');
  }

  productDescription(name: string): Locator {
    return this.productCard(name).getByTestId('inventory-item-desc');
  }

  addToCartButton(name: string): Locator {
    return this.productCard(name).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(name: string): Locator {
    return this.productCard(name).getByRole('button', { name: 'Remove' });
  }

  async addToCart(name: string): Promise<void> {
    await this.addToCartButton(name).click();
  }

  async openProductDetails(name: string): Promise<void> {
    // Image and title are both "View details for <name>" buttons; the title one carries the name as text.
    await this.page
      .getByRole('button', { name: `View details for ${name}`, exact: true })
      .filter({ hasText: name })
      .click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }
}
