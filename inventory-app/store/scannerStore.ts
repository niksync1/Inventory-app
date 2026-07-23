import { create } from "zustand";

interface ScannerState {
  isScanning: boolean;
  lastBarcode: string | null;
  status: "idle" | "not-found" | "error";

  startScanning: () => void;
  stopScanning: () => void;
  setStatus: (status: ScannerState["status"]) => void;
  setLastBarcode: (barcode: string | null) => void;
  reset: () => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  isScanning: true,
  lastBarcode: null,
  status: "idle",

  startScanning: () => set({ isScanning: true }),
  stopScanning: () => set({ isScanning: false }),
  setStatus: (status) => set({ status }),
  setLastBarcode: (barcode) => set({ lastBarcode: barcode }),
  reset: () =>
    set({
      isScanning: true,
      lastBarcode: null,
      status: "idle",
    }),
}));