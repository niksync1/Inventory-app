import { supabase } from "../lib/supabase";
import { InventoryItem } from "../types/inventory";
import { InventoryTransaction } from "../types/transaction";
import { ReportFilter } from "../types/report";

const DEFAULT_BATCH_SIZE = 1000;

export class ReportRepository {
  /** Full product snapshot used for current-inventory reporting. */
  async getAllProducts(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, stock_quantity, price")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []) as InventoryItem[];
  }

  /** Id + name for all products, used by the report product filter. */
  async getProductOptions(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from("products")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []) as { id: string; name: string }[];
  }

  async getTransactionsPage(
    limit: number,
    offset: number,
    filter: ReportFilter = {}
  ): Promise<InventoryTransaction[]> {
    let query = supabase.from("inventory_transactions").select(`
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

    if (filter.productId) query = query.eq("product_id", filter.productId);
    if (filter.from) query = query.gte("created_at", filter.from);
    if (filter.to) query = query.lte("created_at", filter.to);

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data ?? []) as InventoryTransaction[];
  }

  /**
   * Fetch every transaction matching a report filter in bounded pages.
   * Report summaries and exports must not silently stop at the first 200 rows.
   */
  async getAllMatchingTransactions(
    filter: ReportFilter = {},
    batchSize = DEFAULT_BATCH_SIZE
  ): Promise<InventoryTransaction[]> {
    const transactions: InventoryTransaction[] = [];
    let offset = 0;

    while (true) {
      const batch = await this.getTransactionsPage(batchSize, offset, filter);
      transactions.push(...batch);

      if (batch.length < batchSize) break;
      offset += batchSize;
    }

    return transactions;
  }
}

export const reportRepository = new ReportRepository();
