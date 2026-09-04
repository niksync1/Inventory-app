import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LOW_STOCK_THRESHOLD } from "../utils/constants";
export type NotificationsModule = typeof import("expo-notifications");

let cachedModule: NotificationsModule | null | undefined;

function getNotifications(): NotificationsModule | null {
  if (cachedModule === undefined) {
    /* In Expo Go on Android, expo-notifications throws at module init */
    if (Platform.OS === "android" && isRunningInExpoGo()) {
      cachedModule = null;
      return cachedModule;
    }
    try {
      // `require` is used (instead of a static import) so we can catch the
      // synchronous module-evaluation error thrown by Android Expo Go.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("expo-notifications") as NotificationsModule;
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      cachedModule = mod;
    } catch (err) {
      // Not supported in this runtime (e.g. Android Expo Go). Disable feature.
      console.warn(
        "expo-notifications unavailable; local notifications disabled.",
        err
      );
      cachedModule = null;
    }
  }
  return cachedModule;
}

/** Android notification channel used for all inventory alerts. */
export const NOTIFICATION_CHANNEL_ID = "inventory";

/**
 * Key used to de-duplicate low-stock alerts per product. Maps productId -> last
 * notified stock level, so we only alert when a product drops to a *new* low
 * level instead of on every app launch.
 */
const LOW_STOCK_LAST_NOTIFIED_KEY = "notifications:low-stock:last-notified";

export interface LowStockTarget {
  id: string;
  name: string;
  stock_quantity: number;
}

export class NotificationService {
  /** Returns true when local notifications are supported on this runtime. */
  isSupported(): boolean {
    return getNotifications() !== null;
  }

  /**
   * Request notification permissions (prompting the user if needed) and ensure
   * the Android notification channel exists. Returns true when permitted.
   */
  async requestPermissions(): Promise<boolean> {
    const notifications = getNotifications();
    if (!notifications) {
      return false;
    }

    const current = await notifications.getPermissionsAsync();
    let status = current.status;

    if (status !== "granted") {
      const requested = await notifications.requestPermissionsAsync();
      status = requested.status;
    }

    await this.ensureAndroidChannel();
    return status === "granted";
  }

  /** Ensure the Android channel exists so notifications are visible. */
  async ensureAndroidChannel(): Promise<void> {
    const notifications = getNotifications();
    if (!notifications || Platform.OS !== "android") {
      return;
    }

    await notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: "Inventory Alerts",
      importance: notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563eb",
    });
  }

  async hasPermission(): Promise<boolean> {
    const notifications = getNotifications();
    if (!notifications) {
      return false;
    }

    try {
      const settings = await notifications.getPermissionsAsync();
      return settings.granted;
    } catch {
      return false;
    }
  }

  /**
   * Present a local notification immediately (e.g. stock movement confirmation).
   * Best-effort: silently no-ops when unsupported, permission is missing, or on
   * failure.
   */
  async presentLocalNotification(
    title: string,
    body: string,
    data: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const notifications = getNotifications();
      if (!notifications || !(await this.hasPermission())) {
        return;
      }

      await this.ensureAndroidChannel();

      // SDK 57: ChannelAwareTriggerInput ({ channelId }) delivers immediately.
      await notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger: { channelId: NOTIFICATION_CHANNEL_ID },
      });
    } catch (err) {
      // Notifications are non-critical; never propagate errors to the caller.
      console.warn("presentLocalNotification failed:", err);
    }
  }

  /**
   * Schedule a local notification to fire after a delay (e.g. reminder).
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    secondsFromNow: number,
    data: Record<string, unknown> = {}
  ): Promise<string | undefined> {
    try {
      const notifications = getNotifications();
      if (!notifications || !(await this.hasPermission())) {
        return undefined;
      }

      await this.ensureAndroidChannel();

      const id = await notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.round(secondsFromNow)),
          repeats: false,
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      });

      return id;
    } catch (err) {
      console.warn("scheduleLocalNotification failed:", err);
      return undefined;
    }
  }

  /**
   * Alert on low-stock products, but only for products that have *newly*
   * crossed the threshold (not on every call). Persists the last-notified
   * level in AsyncStorage for de-duplication.
   */
  async notifyLowStockIfChanged(
    lowStockItems: LowStockTarget[]
  ): Promise<void> {
    if (lowStockItems.length === 0 || !getNotifications()) {
      return;
    }

    let lastNotified: Record<string, number> = {};
    try {
      const raw = await AsyncStorage.getItem(LOW_STOCK_LAST_NOTIFIED_KEY);
      if (raw) {
        lastNotified = JSON.parse(raw);
      }
    } catch {
      lastNotified = {};
    }

    const updated: Record<string, number> = { ...lastNotified };
    let changed = false;

    for (const item of lowStockItems) {
      const level = Number(item.stock_quantity);
      // Only alert when a product is at/below threshold and we haven't already
      // notified for this same (or lower) level.
      if (level <= LOW_STOCK_THRESHOLD) {
        const last = lastNotified[item.id];
        if (last === undefined || last > level) {
          updated[item.id] = level;
          changed = true;
          void this.presentLocalNotification(
            "Low stock alert",
            `"${item.name}" is low — only ${level} unit(s) left.`,
            { productId: item.id }
          );
        }
      }
    }

    if (changed) {
      try {
        await AsyncStorage.setItem(
          LOW_STOCK_LAST_NOTIFIED_KEY,
          JSON.stringify(updated)
        );
      } catch {
        // Ignore persistence failures; worst case we alert again next launch.
      }
    }
  }
}

export const notificationService = new NotificationService();