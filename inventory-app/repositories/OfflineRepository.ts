import AsyncStorage from "@react-native-async-storage/async-storage";
import { PendingOperation } from "../types/offline";

const OPERATIONS_KEY = "offline:operations:v1";

export class OfflineRepository {
  async getAll(): Promise<PendingOperation[]> {
    try {
      const raw = await AsyncStorage.getItem(OPERATIONS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as PendingOperation[]) : [];
    } catch {
      return [];
    }
  }

  async add(operation: PendingOperation): Promise<void> {
    const current = await this.getAll();
    current.push(operation);
    await AsyncStorage.setItem(OPERATIONS_KEY, JSON.stringify(current));
  }

  async remove(id: string): Promise<void> {
    const current = await this.getAll();
    const next = current.filter((op) => op.id !== id);
    await AsyncStorage.setItem(OPERATIONS_KEY, JSON.stringify(next));
  }

  /** Re-persist a single updated operation (e.g. after incrementing retryCount). */
  async update(operation: PendingOperation): Promise<void> {
    const current = await this.getAll();
    const next = current.map((op) => (op.id === operation.id ? operation : op));
    await AsyncStorage.setItem(OPERATIONS_KEY, JSON.stringify(next));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(OPERATIONS_KEY);
  }
}

export const offlineRepository = new OfflineRepository();
