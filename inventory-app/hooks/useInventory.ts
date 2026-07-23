import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "../services/InventoryService";
import { STALE_TIMES } from "../utils/constants";

export function useInventorySummary() {
  return useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => inventoryService.getSummary(),
    staleTime: STALE_TIMES.INVENTORY,
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: () => inventoryService.getLowStockItems(),
    staleTime: STALE_TIMES.INVENTORY,
  });
}