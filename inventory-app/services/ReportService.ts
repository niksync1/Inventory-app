import { reportRepository } from "../repositories/ReportRepository";
import { LOW_STOCK_THRESHOLD, TRANSACTION_TYPE_LABELS } from "../utils/constants";
import { MovementSummary, InventoryReport, ReportFilter } from "../types/report";
import { TransactionType } from "../types/inventory";

const STOCK_IN_TYPES: TransactionType[] = ["RECEIPT", "RETURN"];
const STOCK_OUT_TYPES: TransactionType[] = [
  "SALE",
  "DAMAGE",
  "EXPIRED",
  "ADJUSTMENT",
];

const MOVEMENT_ORDER: TransactionType[] = [
  "RECEIPT",
  "SALE",
  "RETURN",
  "DAMAGE",
  "EXPIRED",
  "ADJUSTMENT",
];

export class ReportService {
  async getProductOptions(): Promise<{ id: string; name: string }[]> {
    return reportRepository.getProductOptions();
  }

  async getReport(
    filter: ReportFilter = {},
    _transactionLimit = 200
  ): Promise<InventoryReport> {
    const [products, matchingTransactions] = await Promise.all([
      reportRepository.getAllProducts(),
      reportRepository.getAllMatchingTransactions(filter),
    ]);

    const totalUnits = products.reduce(
      (sum, item) => sum + Number(item.stock_quantity || 0),
      0
    );

    const inventoryValue = products.reduce(
      (sum, item) => sum + Number(item.stock_quantity || 0) * Number(item.price || 0),
      0
    );

    const lowStockItems = products
      .filter((item) => Number(item.stock_quantity) <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => Number(a.stock_quantity) - Number(b.stock_quantity));

    const movements: MovementSummary[] = MOVEMENT_ORDER.map((type) => {
      const matching = matchingTransactions.filter(
        (tx) => tx.transaction_type === type
      );
      const signedUnits = matching.reduce(
        (sum, tx) => sum + Number(tx.quantity || 0),
        0
      );
      const movementUnits = STOCK_OUT_TYPES.includes(type)
        ? Math.abs(signedUnits)
        : signedUnits;

      return {
        type,
        count: matching.length,
        totalUnits: movementUnits,
        label: TRANSACTION_TYPE_LABELS[type] ?? type,
      };
    });

    const stockInUnits = movements
      .filter((m) => STOCK_IN_TYPES.includes(m.type as TransactionType))
      .reduce((sum, m) => sum + m.totalUnits, 0);

    const stockOutUnits = movements
      .filter((m) => STOCK_OUT_TYPES.includes(m.type as TransactionType))
      .reduce((sum, m) => sum + m.totalUnits, 0);

    return {
      totalProducts: products.length,
      totalUnits,
      inventoryValue,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      recentTransactions: matchingTransactions,
      stockInUnits,
      stockOutUnits,
      totalMovements: matchingTransactions.length,
      movements,
    };
  }
}

export const reportService = new ReportService();
