-- ============================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================
-- Run this in Supabase SQL Editor to fix the circular dependency
-- ============================================

-- Drop the problematic policies on users table
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- Create better policies that don't cause recursion
-- Simple policy: users can view their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Simple policy: authenticated users can view all users
-- (We'll handle admin-only logic in the app layer if needed)
CREATE POLICY "Authenticated users can view users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only allow inserts/updates through service role or specific functions
-- For now, allow authenticated users (admin check will be in app)
CREATE POLICY "Allow user operations"
  ON users FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- VERIFICATION
-- ============================================
-- After running, test with:
SELECT id, email, name, role FROM users;
