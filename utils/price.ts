// Money is handled in integer cents to avoid floating-point rounding errors.

/** "$29.99", "Tax: $3.20" -> 2999, 320 */
export function toCents(text: string): number {
  const match = text.match(/\$(\d+)\.(\d{2})/);
  if (!match) throw new Error(`No $ amount found in "${text}"`);
  return Number(match[1]) * 100 + Number(match[2]);
}

/** 3998 -> "$39.98" */
export function formatCents(cents: number): string {
  return `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
