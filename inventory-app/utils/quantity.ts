export function parsePositiveIntegerQuantity(value: string): number | null {
  const normalized = value.trim();

  if (!/^[1-9]\d*$/.test(normalized)) {
    return null;
  }

  const quantity = Number(normalized);
  return Number.isSafeInteger(quantity) ? quantity : null;
}
