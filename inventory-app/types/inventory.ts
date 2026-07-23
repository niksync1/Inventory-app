export interface InventoryItem {
  id: string;
  name: string;
  stock_quantity: number;
  price: number;
}

export interface InventorySummary {
  count: number;
  lowStock: number;
}

export type TransactionType =
  | "RECEIPT"
  | "SALE"
  | "RETURN"
  | "DAMAGE"
  | "EXPIRED"
  | "ADJUSTMENT";