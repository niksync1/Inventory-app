import { create } from "zustand";

interface SettingsState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;

  toggleSound: () => void;
  toggleVibration: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEnabled: true,
  vibrationEnabled: true,

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  toggleVibration: () =>
    set((state) => ({ vibrationEnabled: !state.vibrationEnabled })),
}));