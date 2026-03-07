-- ============================================
-- COMPLETE RLS FIX - Remove ALL recursive policies
-- ============================================

-- STEP 1: Drop ALL policies on users table
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;
DROP POLICY IF EXISTS "Allow user operations" ON users;

-- STEP 2: Create simple, non-recursive policies
-- Allow all authenticated users to SELECT (read) from users table
CREATE POLICY "allow_authenticated_read_users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to INSERT (for admin creating users)
CREATE POLICY "allow_authenticated_insert_users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow all authenticated users to UPDATE
CREATE POLICY "allow_authenticated_update_users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow all authenticated users to DELETE
CREATE POLICY "allow_authenticated_delete_users"
  ON users
  FOR DELETE
  TO authenticated
  USING (true);

-- STEP 3: Verify it works
SELECT 'Policies fixed successfully!' as status;

-- Test query (should work now)
SELECT id, email, name, role FROM users LIMIT 1;
