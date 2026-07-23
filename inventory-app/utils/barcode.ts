/**
 * Normalize a barcode by trimming whitespace.
 * Returns null for empty/falsy input.
 */
export function normalizeBarcode(barcode: string): string | null {
  const trimmed = barcode?.trim();
  return trimmed || null;
}

/**
 * Check if a barcode looks valid (non-empty, within reasonable length).
 */
export function isValidBarcode(barcode: string): boolean {
  const normalized = normalizeBarcode(barcode);
  if (!normalized) return false;
  return normalized.length >= 6 && normalized.length <= 18;
}