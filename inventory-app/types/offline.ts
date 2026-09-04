export type OfflineOperationType = "STOCK_IN" | "STOCK_OUT";

/**
 * A stock operation recorded while the device was offline (or queued ahead of
 * other pending operations). Replayed in FIFO order by SyncService once the
 * device is back online.
 */
export interface PendingOperation {
  id: string;
  type: OfflineOperationType;
  productId: string;
  quantity: number;
  /** Required for STOCK_OUT (e.g. "DAMAGE"). */
  transactionType?: string;
  remarks?: string;
  createdAt: string;
  retryCount: number;
}
