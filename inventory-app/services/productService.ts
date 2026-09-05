import { productRepository } from "../repositories/ProductRepository";
import { productCacheRepository } from "../repositories/ProductCacheRepository";
import { useAuthStore } from "../store/authStore";
import { getIsOnline } from "../lib/network";
import { Product } from "../types/product";

const CACHE_PAGE_SIZE = 100;

export class ProductService {
  async lookupByBarcode(barcode: string): Promise<Product | null> {
    const normalized = barcode.trim();
    if (!normalized) {
      return null;
    }

    const userId = useAuthStore.getState().user?.id;
    const online = await getIsOnline();

    let product: Product | null = null;

    if (online) {
      try {
        product = await productRepository.findByBarcode(normalized);
      } catch (err) {
        if (!userId) {
          throw err;
        }
        product = await productCacheRepository.findByBarcode(userId, normalized);
      }
    } else if (userId) {
      product = await productCacheRepository.findByBarcode(userId, normalized);
    }

    if (!product || !product.is_active) {
      return null;
    }

    return product;
  }

  async getProductById(id: string): Promise<Product | null> {
    if (!id) {
      return null;
    }

    const userId = useAuthStore.getState().user?.id;
    const online = await getIsOnline();

    if (online) {
      try {
        return await productRepository.findById(id);
      } catch (err) {
        if (!userId) {
          throw err;
        }
        return productCacheRepository.findById(userId, id);
      }
    }

    return userId ? productCacheRepository.findById(userId, id) : null;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const normalized = query.trim();
    if (normalized.length < 2) {
      return [];
    }

    const userId = useAuthStore.getState().user?.id;
    const online = await getIsOnline();

    if (online) {
      try {
        return await productRepository.search(normalized);
      } catch (err) {
        if (!userId) {
          throw err;
        }
        return productCacheRepository.search(userId, normalized);
      }
    }

    return userId ? productCacheRepository.search(userId, normalized) : [];
  }

  /**
   * Refresh the active user's complete product catalogue for offline lookup.
   * Stock values in this cache are a last-synced snapshot, not live inventory.
   */
  async refreshOfflineCache(): Promise<number> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId || !(await getIsOnline())) {
      return 0;
    }

    const products: Product[] = [];
    let offset = 0;

    while (true) {
      const page = await productRepository.findMany(CACHE_PAGE_SIZE, offset);
      products.push(...page);

      if (page.length < CACHE_PAGE_SIZE) {
        break;
      }

      offset += CACHE_PAGE_SIZE;
    }

    await productCacheRepository.replaceAll(userId, products);
    return products.length;
  }

  async getOfflineCacheSyncedAt(): Promise<string | null> {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      return null;
    }

    const snapshot = await productCacheRepository.getSnapshot(userId);
    return snapshot?.syncedAt ?? null;
  }
}

export const productService = new ProductService();
