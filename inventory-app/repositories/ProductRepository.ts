import { supabase } from "../lib/supabase";
import { Product } from "../types/product";

export class ProductRepository {
  async findByBarcode(barcode: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data as Product;
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return null;
    }

    return data as Product;
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
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(
        `name.ilike.%${query}%,barcode.ilike.%${query}%,category.ilike.%${query}%`
      )
      .limit(50);

    if (error) {
      throw error;
    }

    return (data ?? []) as Product[];
  }
}

export const productRepository = new ProductRepository();