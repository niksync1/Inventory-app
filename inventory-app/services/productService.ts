import { supabase } from "./supabase";
import { Product } from "../types/product";

export class ProductService {
  async getByBarcode(barcode: string): Promise<Product | null> {
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

  async getById(id: string): Promise<Product | null> {
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
}

export const productService = new ProductService();