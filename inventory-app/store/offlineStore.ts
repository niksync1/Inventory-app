import { create } from "zustand";

interface OfflineState {
  /** Whether the device currently has network access. */
  isOnline: boolean;
  /** True once the initial connectivity snapshot has been resolved. */
  isInitialized: boolean;
  /** Number of operations queued locally awaiting sync for the active user. */
  pendingCount: number;
  /** Number of failed operations retained for the active user. */
  failedCount: number;
  /** True while a sync pass is in progress. */
  syncing: boolean;
  /** ISO timestamp of the last successful sync, if any. */
  lastSyncedAt: string | null;
  /** Error message from the last failed sync, if any. */
  syncError: string | null;

  setIsOnline: (online: boolean) => void;
  setIsInitialized: (initialized: boolean) => void;
  setPendingCount: (count: number) => void;
  setFailedCount: (count: number) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncedAt: (at: string | null) => void;
  setSyncError: (error: string | null) => void;
  resetUserState: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: true,
  isInitialized: false,
  pendingCount: 0,
  failedCount: 0,
  syncing: false,
  lastSyncedAt: null,
  syncError: null,

  setIsOnline: (isOnline) => set({ isOnline }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setFailedCount: (failedCount) => set({ failedCount }),
  setSyncing: (syncing) => set({ syncing }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setSyncError: (syncError) => set({ syncError }),
  resetUserState: () =>
    set({
      pendingCount: 0,
      failedCount: 0,
      syncing: false,
      lastSyncedAt: null,
      syncError: null,
    }),
}));
