import { supabase } from "../lib/supabase";
import { Product } from "../types/product";

const SEARCH_LIMIT = 50;

export class ProductRepository {
  async findByBarcode(barcode: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as Product | null;
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as Product | null;
  }

  async findMany(limit = 100, offset = 0): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return (data ?? []) as Product[];
  }

  async search(query: string): Promise<Product[]> {
    const pattern = `%${query}%`;

    // Avoid interpolating user input into PostgREST's raw `.or()` grammar.
    // Each structured `.ilike()` filter passes the search value separately,
    // so punctuation in product names/barcodes cannot alter filter structure.
    const [nameResult, barcodeResult, categoryResult] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .ilike("name", pattern)
        .limit(SEARCH_LIMIT),
      supabase
        .from("products")
        .select("*")
        .ilike("barcode", pattern)
        .limit(SEARCH_LIMIT),
      supabase
        .from("products")
        .select("*")
        .ilike("category", pattern)
        .limit(SEARCH_LIMIT),
    ]);

    const firstError =
      nameResult.error ?? barcodeResult.error ?? categoryResult.error;
    if (firstError) {
      throw firstError;
    }

    const byId = new Map<string, Product>();
    for (const product of [
      ...(nameResult.data ?? []),
      ...(barcodeResult.data ?? []),
      ...(categoryResult.data ?? []),
    ] as Product[]) {
      if (!byId.has(product.id)) {
        byId.set(product.id, product);
      }
    }

    return Array.from(byId.values()).slice(0, SEARCH_LIMIT);
  }
}

export const productRepository = new ProductRepository();
