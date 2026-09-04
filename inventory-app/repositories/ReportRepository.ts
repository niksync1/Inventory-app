import { supabase } from "../lib/supabase";
import { InventoryItem } from "../types/inventory";
import { InventoryTransaction } from "../types/transaction";
import { ReportFilter } from "../types/report";

export class ReportRepository {
  /**
   * Returns the full product snapshot needed for inventory reporting.
   * Unlike InventoryRepository.getSummary (capped at 100), this has no
   * artificial row cap so the report reflects all tracked products.
   */
  async getAllProducts(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, stock_quantity, price")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as InventoryItem[];
  }

  /** Id + name for all products, used to populate a filter dropdown. */
  async getProductOptions(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from("products")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as { id: string; name: string }[];
  }

  async getRecentTransactions(
    limit = 200,
    filter: ReportFilter = {}
  ): Promise<InventoryTransaction[]> {
    let query = supabase
      .from("inventory_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter.productId) {
      query = query.eq("product_id", filter.productId);
    }
    if (filter.from) {
      query = query.gte("created_at", filter.from);
    }
    if (filter.to) {
      query = query.lte("created_at", filter.to);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      throw error;
    }

    return (data ?? []) as InventoryTransaction[];
  }
}

export const reportRepository = new ReportRepository();
