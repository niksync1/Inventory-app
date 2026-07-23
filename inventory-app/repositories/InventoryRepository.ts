import { supabase } from "../lib/supabase";
import { InventoryItem } from "../types/inventory";

export class InventoryRepository {
  async getSummary(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, stock_quantity, price")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return (data ?? []) as InventoryItem[];
  }

  async getLowStockItems(threshold: number): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, stock_quantity, price")
      .lte("stock_quantity", threshold)
      .order("stock_quantity", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as InventoryItem[];
  }
}

export const inventoryRepository = new InventoryRepository();