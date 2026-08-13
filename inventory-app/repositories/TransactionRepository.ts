import { supabase } from "../lib/supabase";
import { InventoryTransaction } from "../types/transaction";

export interface TransactionFilter {
  type?: string;
  productId?: string;
  from?: string;
  to?: string;
}

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

  async findMany(
    limit = 50,
    offset = 0,
    filter: TransactionFilter = {}
  ): Promise<InventoryTransaction[]> {
    let query = supabase
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
      `);

    if (filter.type) {
      query = query.eq("transaction_type", filter.type);
    }

    if (filter.productId) {
      query = query.eq("product_id", filter.productId);
    }

    if (filter.from) {
      query = query.gte("created_at", filter.from);
    }

    if (filter.to) {
      query = query.lte("created_at", filter.to);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return (data ?? []) as InventoryTransaction[];
  }
}

export const transactionRepository = new TransactionRepository();