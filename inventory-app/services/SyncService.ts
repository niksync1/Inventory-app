import { offlineRepository } from "../repositories/OfflineRepository";
import { inventoryRepository } from "../repositories/InventoryRepository";
import { useOfflineStore } from "../store/offlineStore";
import { getIsOnline } from "../lib/network";
import { PendingOperation } from "../types/offline";
import { notificationService } from "./NotificationService";

const MAX_RETRIES = 3;

export class SyncService {
  /** Refresh the queued-operation counter from persistent storage. */
  async refreshPendingCount(): Promise<void> {
    const ops = await offlineRepository.getAll();
    useOfflineStore.getState().setPendingCount(ops.length);
  }

  /** Replay queued operations in FIFO order against Supabase. */
  async syncQueuedOperations(): Promise<number> {
    const store = useOfflineStore.getState();

    if (store.syncing) return 0;

    const online = await getIsOnline();
    if (!online) {
      store.setSyncError(null);
      return 0;
    }

    store.setSyncing(true);
    store.setSyncError(null);
    let synced = 0;

    try {
      const ops = await offlineRepository.getAll();

      for (const op of ops) {
        const outcome = await this.replayOne(op);

        if (outcome === "synced") {
          await offlineRepository.remove(op.id);
          synced += 1;
        } else if (outcome === "permanent") {
          console.warn("Dropping permanent-failure operation:", op.id);
          await offlineRepository.remove(op.id);
        }
      }

      const remaining = await offlineRepository.getAll();
      store.setPendingCount(remaining.length);

      if (remaining.length === 0 && synced > 0) {
        store.setLastSyncedAt(new Date().toISOString());
        void notificationService.presentLocalNotification(
          "Sync complete",
          synced === 1
            ? "1 queued operation synced."
            : `${synced} queued operations synced.`
        );
      }

      return synced;
    } catch (err) {
      store.setSyncError(
        err instanceof Error ? err.message : "Sync failed unexpectedly."
      );
      return synced;
    } finally {
      store.setSyncing(false);
    }
  }

  private async replayOne(
    op: PendingOperation
  ): Promise<"synced" | "retryable" | "permanent"> {
    try {
      if (op.type === "STOCK_IN") {
        await inventoryRepository.stockIn(
          op.productId,
          op.quantity,
          op.remarks,
          op.id
        );
      } else {
        await inventoryRepository.stockOut(
          op.productId,
          op.quantity,
          op.transactionType ?? "ADJUSTMENT",
          op.remarks,
          op.id
        );
      }
      return "synced";
    } catch (err) {
      const nextRetry = op.retryCount + 1;

      if (nextRetry <= MAX_RETRIES) {
        try {
          await offlineRepository.update({ ...op, retryCount: nextRetry });
        } catch {
          // The original operation remains queued if persistence fails.
        }
        return "retryable";
      }

      console.warn("Dropping queued operation after retries:", op.id, err);
      return "permanent";
    }
  }
}

export const syncService = new SyncService();
