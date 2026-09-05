import { ReactNode, useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useOfflineStore } from "../store/offlineStore";
import { useAuthStore } from "../store/authStore";
import { syncService } from "../services/SyncService";
import { productService } from "../services/productService";

interface Props {
  children: ReactNode;
}

/**
 * Monitors network state and drives the offline sync pipeline for the active
 * authenticated user only. When online, it also refreshes the user's local
 * product catalogue for offline lookup.
 */
export default function OfflineProvider({ children }: Props) {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const wasOnline = useRef<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    wasOnline.current = null;

    const init = async () => {
      try {
        await syncService.refreshPendingCount();
      } catch (err) {
        useOfflineStore
          .getState()
          .setSyncError(
            err instanceof Error
              ? err.message
              : "Failed to load offline operation state."
          );
      } finally {
        if (mounted) {
          useOfflineStore.getState().setIsInitialized(true);
        }
      }
    };

    const handleOnline = async () => {
      await syncService.syncQueuedOperations();
      try {
        await productService.refreshOfflineCache();
      } catch (err) {
        console.warn("Failed to refresh offline product catalogue:", err);
      }
    };

    void init();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      if (!mounted) {
        return;
      }

      useOfflineStore.getState().setIsOnline(online);

      const firstOnlineSnapshot = wasOnline.current === null && online;
      const reconnected = wasOnline.current === false && online;

      if (userId && (firstOnlineSnapshot || reconnected)) {
        void handleOnline();
      }

      wasOnline.current = online;
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [userId]);

  return <>{children}</>;
}
