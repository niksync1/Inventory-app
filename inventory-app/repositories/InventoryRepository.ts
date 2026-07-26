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

  async stockIn(
    productId: string,
    quantity: number,
    remarks?: string
  ): Promise<void> {
    const { error } = await supabase.rpc("stock_in", {
      p_product_id: productId,
      p_quantity: quantity,
      p_remarks: remarks ?? null,
    });

    if (error) {
      throw error;
    }
  }

  async stockOut(
    productId: string,
    quantity: number,
    transactionType: string,
    remarks?: string
  ): Promise<void> {
    const { error } = await supabase.rpc("stock_out", {
      p_product_id: productId,
      p_quantity: quantity,
      p_transaction_type: transactionType,
      p_remarks: remarks ?? null,
    });

    if (error) {
      throw error;
    }
  }
}

export const inventoryRepository = new InventoryRepository();