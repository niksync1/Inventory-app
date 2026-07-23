import { supabase } from "../lib/supabase";
import {
  InventoryTransaction,
  CreateTransactionInput,
} from "../types/transaction";

export class TransactionRepository {
  async create(input: CreateTransactionInput): Promise<InventoryTransaction> {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .insert({
        product_id: input.product_id,
        quantity: input.quantity,
        transaction_type: input.transaction_type,
        remarks: input.remarks ?? null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as InventoryTransaction;
  }

  async findByProduct(
    productId: string,
    limit = 50
  ): Promise<InventoryTransaction[]> {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select("*")
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
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return (data ?? []) as InventoryTransaction[];
  }
}

export const transactionRepository = new TransactionRepository();