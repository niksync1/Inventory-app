import { productRepository } from "../repositories/ProductRepository";
import { Product } from "../types/product";

export class ProductService {
  async lookupByBarcode(barcode: string): Promise<Product | null> {
    if (!barcode || barcode.trim().length === 0) {
      return null;
    }

    const product = await productRepository.findByBarcode(barcode.trim());

    if (!product) {
      return null;
    }

    if (!product.is_active) {
      return null;
    }

    return product;
  }

  async getProductById(id: string): Promise<Product | null> {
    if (!id) {
      return null;
    }

    return productRepository.findById(id);
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return productRepository.search(query.trim());
  }
}

export const productService = new ProductService();