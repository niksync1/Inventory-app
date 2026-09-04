import { ReactNode, useEffect, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useOfflineStore } from "../store/offlineStore";
import { syncService } from "../services/SyncService";

interface Props {
  children: ReactNode;
}

/**
 * Monitors network state and drives the offline sync pipeline:
 * - Tracks isOnline / isInitialized in the offline store.
 * - Loads the pending-operation count at startup.
 * - Replays queued operations whenever the device returns online.
 */
export default function OfflineProvider({ children }: Props) {
  const wasOnline = useRef<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await syncService.refreshPendingCount();
      if (mounted) {
        useOfflineStore.getState().setIsInitialized(true);
      }
    };

    void init();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      if (!mounted) {
        return;
      }

      useOfflineStore.getState().setIsOnline(online);

      // Transitioning from offline -> online: replay queued operations.
      if (wasOnline.current === false && online) {
        void syncService.syncQueuedOperations();
      }

      wasOnline.current = online;
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
