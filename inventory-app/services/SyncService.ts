import { offlineRepository } from "../repositories/OfflineRepository";
import { inventoryRepository } from "../repositories/InventoryRepository";
import { useOfflineStore } from "../store/offlineStore";
import { useAuthStore } from "../store/authStore";
import { getIsOnline } from "../lib/network";
import { PendingOperation } from "../types/offline";
import { notificationService } from "./NotificationService";

const MAX_RETRIES = 3;

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Unknown sync error";

export class SyncService {
  /** Refresh queued/failed counters for the currently authenticated user. */
  async refreshPendingCount(): Promise<void> {
    const store = useOfflineStore.getState();
    const userId = useAuthStore.getState().user?.id;

    if (!userId) {
      store.resetUserState();
      return;
    }

    const [pending, failed, legacyCount] = await Promise.all([
      offlineRepository.getPending(userId),
      offlineRepository.getFailed(userId),
      offlineRepository.getLegacyUnscopedCount(),
    ]);

    store.setPendingCount(pending.length);
    store.setFailedCount(failed.length);

    if (legacyCount > 0) {
      store.setSyncError(
        `${legacyCount} legacy offline operation(s) were retained but not replayed because their user ownership is unknown.`
      );
    }
  }

  /** Replay only the active user's pending operations in FIFO order. */
  async syncQueuedOperations(): Promise<number> {
    const store = useOfflineStore.getState();
    const userId = useAuthStore.getState().user?.id;

    if (!userId) {
      store.resetUserState();
      return 0;
    }

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
      const ops = await offlineRepository.getPending(userId);

      for (const op of ops) {
        if (op.userId !== userId) {
          store.setSyncError(
            `Queued operation ${op.id} has invalid user ownership and was not replayed.`
          );
          continue;
        }

        const outcome = await this.replayOne(op);

        if (outcome.status === "synced") {
          await offlineRepository.remove(userId, op.id);
          synced += 1;
        } else if (outcome.status === "failed") {
          await offlineRepository.markFailed(op, outcome.error);
        }
      }

      const [remaining, failed] = await Promise.all([
        offlineRepository.getPending(userId),
        offlineRepository.getFailed(userId),
      ]);
      store.setPendingCount(remaining.length);
      store.setFailedCount(failed.length);

      if (remaining.length === 0 && synced > 0) {
        store.setLastSyncedAt(new Date().toISOString());
        void notificationService.presentLocalNotification(
          "Sync complete",
          synced === 1
            ? "1 queued operation synced."
            : `${synced} queued operations synced.`
        );
      }

      if (failed.length > 0) {
        store.setSyncError(
          `${failed.length} offline operation(s) could not be synced and were retained for review.`
        );
      }

      return synced;
    } catch (err) {
      store.setSyncError(errorMessage(err));
      return synced;
    } finally {
      store.setSyncing(false);
    }
  }

  private async replayOne(
    op: PendingOperation
  ): Promise<
    | { status: "synced" }
    | { status: "retryable" }
    | { status: "failed"; error: string }
  > {
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
      return { status: "synced" };
    } catch (err) {
      const nextRetry = op.retryCount + 1;
      const message = errorMessage(err);

      if (nextRetry <= MAX_RETRIES) {
        await offlineRepository.update({
          ...op,
          retryCount: nextRetry,
          lastError: message,
        });
        return { status: "retryable" };
      }

      console.warn("Retaining failed queued operation:", op.id, err);
      return { status: "failed", error: message };
    }
  }
}

export const syncService = new SyncService();
