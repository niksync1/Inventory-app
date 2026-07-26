-- RPC: stock_in
-- Atomically adds stock and records a RECEIPT transaction.
-- Validates product existence via the UPDATE (no-op if not found).
CREATE OR REPLACE FUNCTION stock_in(
  p_product_id UUID,
  p_quantity INT,
  p_remarks TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = stock_quantity + p_quantity, 
      updated_at = NOW()
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  INSERT INTO inventory_transactions (product_id, quantity, transaction_type, remarks, created_by)
  VALUES (p_product_id, p_quantity, 'RECEIPT', p_remarks, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: stock_out
-- Atomically deducts stock and records a transaction.
-- Validates product exists and has sufficient stock before updating.
CREATE OR REPLACE FUNCTION stock_out(
  p_product_id UUID,
  p_quantity INT,
  p_transaction_type TEXT,
  p_remarks TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  current_stock INT;
BEGIN
  SELECT stock_quantity INTO current_stock FROM products WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, requested: %', current_stock, p_quantity;
  END IF;

  UPDATE products 
  SET stock_quantity = stock_quantity - p_quantity, 
      updated_at = NOW()
  WHERE id = p_product_id;

  INSERT INTO inventory_transactions (product_id, quantity, transaction_type, remarks, created_by)
  VALUES (p_product_id, -p_quantity, p_transaction_type, p_remarks, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
