import NetInfo from "@react-native-community/netinfo";

/**
 * Snapshot check of current connectivity. We treat the device as online only
 * when NetInfo reports a connection AND the internet is reachable (when the
 * platform reports reachability).
 */
export async function getIsOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return !!state.isConnected && state.isInternetReachable !== false;
  } catch {
    // If connectivity cannot be determined, be conservative and treat as offline
    // so operations are queued rather than silently dropped.
    return false;
  }
}
