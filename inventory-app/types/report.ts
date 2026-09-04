import { InventoryItem } from "./inventory";
import { InventoryTransaction } from "./transaction";

export interface MovementSummary {
  /** Transaction type key (e.g. "RECEIPT", "SALE", "RETURN", ...). */
  type: string;
  /** Human-readable label for the transaction type. */
  label: string;
  /** Number of transactions of this type. */
  count: number;
  /** Sum of quantities across transactions of this type. */
  totalUnits: number;
}

export interface ReportFilter {
  /** Start of the date range (inclusive), as an ISO string. */
  from?: string;
  /** End of the date range (inclusive), as an ISO string. */
  to?: string;
  /** Restrict activity metrics to a single product id. */
  productId?: string;
}

export interface InventoryReport {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  /** Low-stock items sorted by stock ascending (lowest first). */
  lowStockItems: InventoryItem[];
  recentTransactions: InventoryTransaction[];
  /** Units received into inventory (RECEIPT + RETURN). */
  stockInUnits: number;
  /** Units removed from inventory (SALE + DAMAGE + EXPIRED + ADJUSTMENT). */
  stockOutUnits: number;
  /** Number of inventory movements in the report window. */
  totalMovements: number;
  /** Per-transaction-type breakdown. */
  movements: MovementSummary[];
}
