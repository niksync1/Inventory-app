import { inventoryRepository } from "../repositories/InventoryRepository";
import { InventoryItem, InventorySummary, TransactionType } from "../types/inventory";
import { LOW_STOCK_THRESHOLD } from "../utils/constants";
import { isReasonableQuantity } from "../utils/validation";

export class InventoryService {
  async getSummary(): Promise<InventorySummary> {
    const items = await inventoryRepository.getSummary();

    return {
      count: items.length,
      lowStock: items.filter(
        (item) => Number(item.stock_quantity) <= LOW_STOCK_THRESHOLD
      ).length,
    };
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return inventoryRepository.getLowStockItems(LOW_STOCK_THRESHOLD);
  }

  async stockIn(
    productId: string,
    quantity: number,
    remarks?: string
  ): Promise<void> {
    if (!isReasonableQuantity(quantity)) {
      throw new Error("Invalid quantity. Must be a positive integer.");
    }

    // RPC handles: validate product exists, update stock, insert transaction (atomic)
    await inventoryRepository.stockIn(productId, quantity, remarks);
  }

  async stockOut(
    productId: string,
    quantity: number,
    reason: TransactionType,
    remarks?: string
  ): Promise<void> {
    if (!isReasonableQuantity(quantity)) {
      throw new Error("Invalid quantity. Must be a positive integer.");
    }

    const validReasons: TransactionType[] = [
      "DAMAGE",
      "EXPIRED",
      "ADJUSTMENT",
      "SALE",
    ];

    if (!validReasons.includes(reason)) {
      throw new Error(
        `Invalid reason. Must be one of: ${validReasons.join(", ")}`
      );
    }

    // RPC handles: validate product exists, check stock sufficiency,
    // update stock, insert transaction (atomic)
    await inventoryRepository.stockOut(productId, quantity, reason, remarks);
  }
}

export const inventoryService = new InventoryService();