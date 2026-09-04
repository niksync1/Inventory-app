import { inventoryRepository } from "../repositories/InventoryRepository";
import { offlineRepository } from "../repositories/OfflineRepository";
import { useOfflineStore } from "../store/offlineStore";
import { getIsOnline } from "../lib/network";
import { PendingOperation } from "../types/offline";
import { generateId } from "../utils/id";
import { InventoryItem, InventorySummary, TransactionType } from "../types/inventory";
import { LOW_STOCK_THRESHOLD } from "../utils/constants";
import { isReasonableQuantity } from "../utils/validation";
import { notificationService } from "./NotificationService";

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

    const operationId = generateId("op");

    if (!(await getIsOnline())) {
      await this.enqueue({
        id: operationId,
        type: "STOCK_IN",
        productId,
        quantity,
        remarks,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      });
      return;
    }

    await inventoryRepository.stockIn(productId, quantity, remarks, operationId);

    void notificationService.presentLocalNotification(
      "Stock received",
      `${quantity} unit(s) added to stock.`
    );
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

    const operationId = generateId("op");

    if (!(await getIsOnline())) {
      await this.enqueue({
        id: operationId,
        type: "STOCK_OUT",
        productId,
        quantity,
        transactionType: reason,
        remarks,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      });
      return;
    }

    await inventoryRepository.stockOut(
      productId,
      quantity,
      reason,
      remarks,
      operationId
    );

    void notificationService.presentLocalNotification(
      "Stock removed",
      `${quantity} unit(s) removed (${reason}).`
    );
  }

  /** Queue an operation for offline sync and update the pending counter. */
  private async enqueue(op: PendingOperation): Promise<void> {
    await offlineRepository.add(op);
    const all = await offlineRepository.getAll();
    useOfflineStore.getState().setPendingCount(all.length);

    void notificationService.presentLocalNotification(
      "Offline — queued for sync",
      op.type === "STOCK_IN"
        ? `${op.quantity} unit(s) stock-in queued. Will sync when back online.`
        : `${op.quantity} unit(s) stock-out queued. Will sync when back online.`
    );
  }
}

export const inventoryService = new InventoryService();