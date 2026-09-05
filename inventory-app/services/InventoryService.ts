import { inventoryRepository } from "../repositories/InventoryRepository";
import { offlineRepository } from "../repositories/OfflineRepository";
import { productCacheRepository } from "../repositories/ProductCacheRepository";
import { useOfflineStore } from "../store/offlineStore";
import { useAuthStore } from "../store/authStore";
import { getIsOnline } from "../lib/network";
import { PendingOperation } from "../types/offline";
import { generateId } from "../utils/id";
import { InventoryItem, InventorySummary, TransactionType } from "../types/inventory";
import { LOW_STOCK_THRESHOLD } from "../utils/constants";
import { isReasonableQuantity } from "../utils/validation";
import { notificationService } from "./NotificationService";

export class InventoryService {
  async getSummary(): Promise<InventorySummary> {
    const items = await this.getInventoryItems();

    return {
      count: items.length,
      lowStock: items.filter(
        (item) => Number(item.stock_quantity) <= LOW_STOCK_THRESHOLD
      ).length,
    };
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    const online = await getIsOnline();

    if (online) {
      try {
        return await inventoryRepository.getLowStockItems(LOW_STOCK_THRESHOLD);
      } catch (err) {
        const cached = await this.getCachedInventoryItems();
        if (cached) {
          return cached.filter(
            (item) => Number(item.stock_quantity) <= LOW_STOCK_THRESHOLD
          );
        }
        throw err;
      }
    }

    const cached = await this.getCachedInventoryItems();
    return (
      cached?.filter(
        (item) => Number(item.stock_quantity) <= LOW_STOCK_THRESHOLD
      ) ?? []
    );
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
      const userId = this.requireUserId();
      await this.enqueue({
        id: operationId,
        userId,
        type: "STOCK_IN",
        productId,
        quantity,
        remarks,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: "PENDING",
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
      const userId = this.requireUserId();
      await this.enqueue({
        id: operationId,
        userId,
        type: "STOCK_OUT",
        productId,
        quantity,
        transactionType: reason,
        remarks,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        status: "PENDING",
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

  private async getInventoryItems(): Promise<InventoryItem[]> {
    const online = await getIsOnline();

    if (online) {
      try {
        return await inventoryRepository.getSummary();
      } catch (err) {
        const cached = await this.getCachedInventoryItems();
        if (cached) {
          return cached;
        }
        throw err;
      }
    }

    return (await this.getCachedInventoryItems()) ?? [];
  }

  private async getCachedInventoryItems(): Promise<InventoryItem[] | null> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      return null;
    }

    const snapshot = await productCacheRepository.getSnapshot(userId);
    if (!snapshot) {
      return null;
    }

    return snapshot.products.map((product) => ({
      id: product.id,
      name: product.name,
      stock_quantity: product.stock_quantity,
      price: product.price,
    }));
  }

  private requireUserId(): string {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      throw new Error("Cannot queue inventory changes without an authenticated user.");
    }
    return userId;
  }

  /** Queue an operation for the active user and update that user's pending counter. */
  private async enqueue(op: PendingOperation): Promise<void> {
    await offlineRepository.add(op);
    const pending = await offlineRepository.getPending(op.userId);
    useOfflineStore.getState().setPendingCount(pending.length);

    void notificationService.presentLocalNotification(
      "Offline — queued for sync",
      op.type === "STOCK_IN"
        ? `${op.quantity} unit(s) stock-in queued. Will sync when back online.`
        : `${op.quantity} unit(s) stock-out queued. Will sync when back online.`
    );
  }
}

export const inventoryService = new InventoryService();
