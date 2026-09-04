import AsyncStorage from "@react-native-async-storage/async-storage";
import { PendingOperation } from "../types/offline";

const LEGACY_OPERATIONS_KEY = "offline:operations:v1";
const operationsKey = (userId: string) => `offline:operations:v2:${userId}`;

export class OfflineRepository {
  private async read(userId: string): Promise<PendingOperation[]> {
    const raw = await AsyncStorage.getItem(operationsKey(userId));
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Offline operation storage is corrupted.");
    }

    return parsed as PendingOperation[];
  }

  async getAll(userId: string): Promise<PendingOperation[]> {
    return this.read(userId);
  }

  async getPending(userId: string): Promise<PendingOperation[]> {
    const operations = await this.read(userId);
    return operations.filter((op) => op.status === "PENDING");
  }

  async getFailed(userId: string): Promise<PendingOperation[]> {
    const operations = await this.read(userId);
    return operations.filter((op) => op.status === "FAILED");
  }

  async add(operation: PendingOperation): Promise<void> {
    const current = await this.read(operation.userId);
    current.push(operation);
    await AsyncStorage.setItem(
      operationsKey(operation.userId),
      JSON.stringify(current)
    );
  }

  async remove(userId: string, id: string): Promise<void> {
    const current = await this.read(userId);
    const next = current.filter((op) => op.id !== id);
    await AsyncStorage.setItem(operationsKey(userId), JSON.stringify(next));
  }

  async update(operation: PendingOperation): Promise<void> {
    const current = await this.read(operation.userId);
    const next = current.map((op) =>
      op.id === operation.id ? operation : op
    );
    await AsyncStorage.setItem(
      operationsKey(operation.userId),
      JSON.stringify(next)
    );
  }

  async markFailed(
    operation: PendingOperation,
    errorMessage: string
  ): Promise<void> {
    await this.update({
      ...operation,
      status: "FAILED",
      lastError: errorMessage,
      failedAt: new Date().toISOString(),
    });
  }

  async clear(userId: string): Promise<void> {
    await AsyncStorage.removeItem(operationsKey(userId));
  }

  /**
   * Legacy v1 operations had no user ownership. They are deliberately never
   * replayed automatically because attributing them to the current user would
   * corrupt the audit trail.
   */
  async getLegacyUnscopedCount(): Promise<number> {
    const raw = await AsyncStorage.getItem(LEGACY_OPERATIONS_KEY);
    if (!raw) {
      return 0;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("Legacy offline operation storage is corrupted.");
    }

    return parsed.length;
  }
}

export const offlineRepository = new OfflineRepository();
