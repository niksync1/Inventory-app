export const LOW_STOCK_THRESHOLD = 5;

export const STALE_TIMES = {
  PRODUCT: 1000 * 60 * 5, // 5 minutes
  INVENTORY: 1000 * 60 * 2, // 2 minutes
  TRANSACTIONS: 1000 * 60, // 1 minute
} as const;

export const BARCODE_TYPES = [
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "code39",
  "qr",
] as const;

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  RECEIPT: "Stock In",
  SALE: "Sale",
  RETURN: "Return",
  DAMAGE: "Damage",
  EXPIRED: "Expired",
  ADJUSTMENT: "Adjustment",
};