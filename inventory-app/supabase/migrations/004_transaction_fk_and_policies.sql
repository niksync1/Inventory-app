-- ============================================================
-- Fix History screen: add missing FK + allow all users to read transactions
-- ============================================================

-- 1. Add missing foreign key from inventory_transactions.created_by -> profiles(id)
--    Supabase needs this FK to resolve the `profiles:created_by` join in the
--    TransactionRepository.findMany() query. Without it, the query throws an
--    error and the History screen shows "Could not load history".
ALTER TABLE public.inventory_transactions
  ADD CONSTRAINT inventory_transactions_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles (id)
  ON DELETE SET NULL;

-- 2. Allow all authenticated users to read transactions.
--    The previous policy only allowed admins, which blocked warehouse users
--    from seeing any transaction history (RLS returns zero rows).
DROP POLICY IF EXISTS "Admins can read all transactions" ON inventory_transactions;

CREATE POLICY "Authenticated users can read all transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (true);