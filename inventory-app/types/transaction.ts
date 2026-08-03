import { TransactionType } from "./inventory";

export interface InventoryTransaction {
  id: string;
  product_id: string;
  quantity: number;
  transaction_type: TransactionType;
  remarks?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  products?: {
    id: string;
    name: string;
    barcode?: string | null;
  } | null;
  profiles?: {
    id: string;
    email: string;
    name?: string | null;
  } | null;
}

export interface CreateTransactionInput {
  product_id: string;
  quantity: number;
  transaction_type: TransactionType;
  remarks?: string;
}