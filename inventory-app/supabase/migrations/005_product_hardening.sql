-- ============================================================
-- Product hardening: authorization and inventory integrity
-- ============================================================

-- New users must never be able to choose their own privileged role through
-- client-controlled auth metadata. All signups start as warehouse users;
-- administrators can promote users through a trusted admin path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'warehouse');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users may edit their own non-privileged profile fields, but may not change
-- their role. Admin role changes must happen through a trusted admin path.
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = OLD.id AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Users cannot change their own role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_self_role_change ON public.profiles;
CREATE TRIGGER prevent_self_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_change();

-- Central authorization helper for SECURITY DEFINER inventory functions.
CREATE OR REPLACE FUNCTION public.can_manage_inventory()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('warehouse', 'admin')
  );
$$;

-- Idempotency key used by mobile/offline clients. NULL preserves compatibility
-- with historical transactions while current callers provide an operation id.
ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS operation_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS inventory_transactions_operation_id_uidx
  ON public.inventory_transactions (operation_id)
  WHERE operation_id IS NOT NULL;

-- PostgreSQL identifies functions by name + argument types. Adding a defaulted
-- parameter would otherwise create an overload and leave the legacy SECURITY
-- DEFINER RPC callable. Remove the old signatures before creating hardened RPCs.
DROP FUNCTION IF EXISTS public.stock_in(UUID, INT, TEXT);
DROP FUNCTION IF EXISTS public.stock_out(UUID, INT, TEXT, TEXT);

-- Atomic, authorized and idempotent stock-in.
CREATE FUNCTION public.stock_in(
  p_product_id UUID,
  p_quantity INT,
  p_remarks TEXT DEFAULT NULL,
  p_operation_id TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF NOT public.can_manage_inventory() THEN
    RAISE EXCEPTION 'Not authorized to manage inventory';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be a positive integer';
  END IF;

  IF p_operation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.inventory_transactions WHERE operation_id = p_operation_id
  ) THEN
    RETURN;
  END IF;

  UPDATE public.products
  SET stock_quantity = stock_quantity + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  INSERT INTO public.inventory_transactions
    (product_id, quantity, transaction_type, remarks, created_by, operation_id)
  VALUES
    (p_product_id, p_quantity, 'RECEIPT', p_remarks, auth.uid(), p_operation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atomic, authorized and idempotent stock-out. The conditional UPDATE prevents
-- concurrent callers from both spending the same available stock.
CREATE FUNCTION public.stock_out(
  p_product_id UUID,
  p_quantity INT,
  p_transaction_type TEXT,
  p_remarks TEXT DEFAULT NULL,
  p_operation_id TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  product_exists BOOLEAN;
BEGIN
  IF NOT public.can_manage_inventory() THEN
    RAISE EXCEPTION 'Not authorized to manage inventory';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be a positive integer';
  END IF;

  IF p_transaction_type NOT IN ('DAMAGE', 'EXPIRED', 'ADJUSTMENT', 'SALE') THEN
    RAISE EXCEPTION 'Invalid stock-out transaction type: %', p_transaction_type;
  END IF;

  IF p_operation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.inventory_transactions WHERE operation_id = p_operation_id
  ) THEN
    RETURN;
  END IF;

  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id
    AND stock_quantity >= p_quantity;

  IF NOT FOUND THEN
    SELECT EXISTS(
      SELECT 1 FROM public.products WHERE id = p_product_id
    ) INTO product_exists;

    IF NOT product_exists THEN
      RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;

    RAISE EXCEPTION 'Insufficient stock for product: %', p_product_id;
  END IF;

  INSERT INTO public.inventory_transactions
    (product_id, quantity, transaction_type, remarks, created_by, operation_id)
  VALUES
    (p_product_id, -p_quantity, p_transaction_type, p_remarks, auth.uid(), p_operation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Restrict direct execution to authenticated application users. Authorization
-- inside each function still decides whether the caller may change inventory.
REVOKE ALL ON FUNCTION public.stock_in(UUID, INT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stock_out(UUID, INT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stock_in(UUID, INT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stock_out(UUID, INT, TEXT, TEXT, TEXT) TO authenticated;
