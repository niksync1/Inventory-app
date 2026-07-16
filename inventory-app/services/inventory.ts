import { supabase } from './supabase';

export interface InventoryItem {
  id: string;
  name: string;
  stock_quantity: number;
  price: number;
}

export async function getInventorySummary() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock_quantity, price')
    .order('updated_at', { ascending: false })
    .limit(10);

  return { data: data as InventoryItem[] | null, error };
}
