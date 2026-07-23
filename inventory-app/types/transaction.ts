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
}

export interface CreateTransactionInput {
  product_id: string;
  quantity: number;
  transaction_type: TransactionType;
  remarks?: string;
}