export type OfflineOperationType = "STOCK_IN" | "STOCK_OUT";
export type OfflineOperationStatus = "PENDING" | "FAILED";

/**
 * A stock operation recorded while the device was offline (or queued ahead of
 * other pending operations). Operations are scoped to the user that created
 * them and may only be replayed while that same user is authenticated.
 */
export interface PendingOperation {
  id: string;
  userId: string;
  type: OfflineOperationType;
  productId: string;
  quantity: number;
  /** Required for STOCK_OUT (e.g. "DAMAGE"). */
  transactionType?: string;
  remarks?: string;
  createdAt: string;
  retryCount: number;
  status: OfflineOperationStatus;
  lastError?: string;
  failedAt?: string;
}
