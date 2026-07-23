export function formatCurrency(amount: number, currency = "GHS"): string {
  return `${currency} ${amount.toFixed(2)}`;
}

export function formatStockQuantity(quantity: number): string {
  return quantity <= 5 ? `${quantity} left` : `Stock: ${quantity}`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}