import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useScannerStore } from "../store/scannerStore";

export function useScanner() {
  const {
    isScanning,
    lastBarcode,
    status,
    startScanning,
    stopScanning,
    setStatus,
    setLastBarcode,
    reset,
  } = useScannerStore();

  useFocusEffect(
    useCallback(() => {
      reset();
    }, [reset])
  );

  return {
    isScanning,
    lastBarcode,
    status,
    startScanning,
    stopScanning,
    setStatus,
    setLastBarcode,
  };
}