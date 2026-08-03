-- ============================================================
-- Fix RLS infinite recursion on profiles
-- ============================================================
-- The "Admins can read all profiles" policy queries the profiles
-- table to check if the current user is an admin. That inner query
-- also triggers RLS on profiles, causing infinite recursion.
--
-- Fix: create a SECURITY DEFINER function that bypasses RLS to
-- check the admin role, then update all policies to use it.

-- Helper function: is the current user an admin?
-- SECURITY DEFINER bypasses RLS so this doesn't recurse.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- Fix profiles policies
-- ============================================================

-- Drop the recursive "Admins can read all profiles" policy
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Recreate it using the is_admin() helper
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- Fix products policies (use is_admin() instead of inline EXISTS)
-- ============================================================

DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- Fix categories policies
-- ============================================================

DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- Fix inventory_transactions policies
-- ============================================================

DROP POLICY IF EXISTS "Admins can read all transactions" ON inventory_transactions;
CREATE POLICY "Admins can read all transactions"
  ON inventory_transactions FOR SELECT
  TO authenticated
  USING (public.is_admin());