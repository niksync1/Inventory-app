import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "../types/product";

interface ProductCacheSnapshot {
  syncedAt: string;
  products: Product[];
}

const cacheKey = (userId: string) => `offline:products:v1:${userId}`;

export class ProductCacheRepository {
  private async read(userId: string): Promise<ProductCacheSnapshot | null> {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("syncedAt" in parsed) ||
      !("products" in parsed) ||
      !Array.isArray((parsed as ProductCacheSnapshot).products)
    ) {
      throw new Error("Offline product cache is corrupted.");
    }

    return parsed as ProductCacheSnapshot;
  }

  async replaceAll(userId: string, products: Product[]): Promise<void> {
    const snapshot: ProductCacheSnapshot = {
      syncedAt: new Date().toISOString(),
      products,
    };
    await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(snapshot));
  }

  async getSnapshot(userId: string): Promise<ProductCacheSnapshot | null> {
    return this.read(userId);
  }

  async findByBarcode(userId: string, barcode: string): Promise<Product | null> {
    const snapshot = await this.read(userId);
    return (
      snapshot?.products.find((product) => product.barcode === barcode) ?? null
    );
  }

  async findById(userId: string, id: string): Promise<Product | null> {
    const snapshot = await this.read(userId);
    return snapshot?.products.find((product) => product.id === id) ?? null;
  }

  async search(userId: string, query: string): Promise<Product[]> {
    const snapshot = await this.read(userId);
    if (!snapshot) {
      return [];
    }

    const normalized = query.trim().toLowerCase();
    return snapshot.products
      .filter((product) => {
        return (
          product.name.toLowerCase().includes(normalized) ||
          product.barcode.toLowerCase().includes(normalized) ||
          (product.category ?? "").toLowerCase().includes(normalized)
        );
      })
      .slice(0, 50);
  }

  async clear(userId: string): Promise<void> {
    await AsyncStorage.removeItem(cacheKey(userId));
  }
}

export const productCacheRepository = new ProductCacheRepository();
