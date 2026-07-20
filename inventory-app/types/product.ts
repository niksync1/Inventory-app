export interface Product {
  id: string;
  name: string;
  slug: string;
  barcode: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  stock_quantity: number;
  category?: string;
  images: string[];
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}