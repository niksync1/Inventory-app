import { supabase } from "../lib/supabase";
import { InventoryTransaction } from "../types/transaction";

export class TransactionRepository {
  async findByProduct(
    productId: string,
    limit = 50
  ): Promise<InventoryTransaction[]> {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select(`
        *,
        products:product_id (
          id,
          name,
          barcode
        ),
        profiles:created_by (
          id,
          email,
          name
        )
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []) as InventoryTransaction[];
  }

  async findMany(limit = 50, offset = 0): Promise<InventoryTransaction[]> {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select(`
        *,
        products:product_id (
          id,
          name,
          barcode
        ),
        profiles:created_by (
          id,
          email,
          name
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return (data ?? []) as InventoryTransaction[];
  }
}

export const transactionRepository = new TransactionRepository();