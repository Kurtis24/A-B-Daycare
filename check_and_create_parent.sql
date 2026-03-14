-- ============================================================================
-- STEP 1: Check Existing Users in Your Database
-- ============================================================================
-- Run this first to see what users already exist
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.created_at,
  CASE 
    WHEN u.role = 'parent' THEN (
      SELECT COUNT(*) FROM children WHERE parent_user_id = u.id
    )
    ELSE NULL
  END as child_count
FROM users u
ORDER BY u.created_at DESC;

-- ============================================================================
-- STEP 2: Check Existing Children
-- ============================================================================
SELECT 
  c.id,
  c.name,
  c.age_group,
  c.parent_user_id,
  u.email as parent_email,
  u.name as parent_name
FROM children c
LEFT JOIN users u ON u.id = c.parent_user_id
ORDER BY c.created_at DESC;

-- ============================================================================
-- STEP 3: Check Auth Users (from Supabase Auth)
-- ============================================================================
-- This shows users in the auth.users table
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.last_sign_in_at,
  CASE 
    WHEN u.id IS NOT NULL THEN 'Has user record'
    ELSE 'Missing user record'
  END as status
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
ORDER BY au.created_at DESC;

-- ============================================================================
-- STEP 4: Create Test Parent User (if needed)
-- ============================================================================
-- IMPORTANT: Before running this section:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Email: parent@test.com
-- 4. Password: TestParent123!
-- 5. Copy the UUID that gets generated
-- 6. Replace 'PASTE_AUTH_USER_UUID_HERE' below with that UUID

DO $$
DECLARE
  v_auth_uuid UUID := 'PASTE_AUTH_USER_UUID_HERE'; -- REPLACE THIS!
  v_child_id UUID;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE id = v_auth_uuid) THEN
    RAISE NOTICE 'User already exists with ID: %', v_auth_uuid;
  ELSE
    -- Insert parent user record
    INSERT INTO users (id, email, name, role)
    VALUES (v_auth_uuid, 'parent@test.com', 'Test Parent', 'parent');
    RAISE NOTICE 'Created parent user with ID: %', v_auth_uuid;
  END IF;

  -- Check if child already exists for this parent
  IF EXISTS (SELECT 1 FROM children WHERE parent_user_id = v_auth_uuid) THEN
    RAISE NOTICE 'Child already exists for this parent';
  ELSE
    -- Create a child for this parent
    INSERT INTO children (name, date_of_birth, age_group, parent_user_id)
    VALUES ('Emma Johnson', '2022-03-15', '2-3', v_auth_uuid)
    RETURNING id INTO v_child_id;
    RAISE NOTICE 'Created child with ID: %', v_child_id;
  END IF;

  RAISE NOTICE '✅ Test parent setup complete!';
END $$;

-- ============================================================================
-- STEP 5: Verify the Parent User was Created
-- ============================================================================
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  c.name as child_name,
  c.age_group as child_age_group,
  c.date_of_birth as child_dob
FROM users u
LEFT JOIN children c ON c.parent_user_id = u.id
WHERE u.email = 'parent@test.com';

-- ============================================================================
-- ALTERNATIVE: Create Parent from Existing Auth User
-- ============================================================================
-- If you already have an auth user but they're missing from the users table,
-- uncomment and run this section:

/*
-- First, find the auth user UUID
SELECT id, email FROM auth.users WHERE email LIKE '%parent%' OR email LIKE '%test%';

-- Then insert into users table (replace the UUID)
INSERT INTO users (id, email, name, role)
VALUES ('EXISTING_AUTH_UUID_HERE', 'existing@email.com', 'Parent Name', 'parent')
ON CONFLICT (id) DO NOTHING;

-- Create child for this parent
INSERT INTO children (name, date_of_birth, age_group, parent_user_id)
VALUES ('Child Name', '2022-03-15', '2-3', 'EXISTING_AUTH_UUID_HERE')
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- BONUS: Create Multiple Test Users
-- ============================================================================
-- Uncomment to create additional test users (after creating them in Auth first)

/*
-- Test Teacher
INSERT INTO users (id, email, name, role)
VALUES ('TEACHER_AUTH_UUID', 'teacher@test.com', 'Test Teacher', 'teacher');

INSERT INTO teachers (user_id, assigned_age_groups)
VALUES ('TEACHER_AUTH_UUID', ARRAY['2-3']);

-- Test Super Teacher
INSERT INTO users (id, email, name, role)
VALUES ('SUPER_TEACHER_AUTH_UUID', 'superteacher@test.com', 'Test Super Teacher', 'super_teacher');

INSERT INTO teachers (user_id, is_super_teacher, assigned_age_groups)
VALUES ('SUPER_TEACHER_AUTH_UUID', true, ARRAY['0-1', '2-3', '4-5']);
*/

-- ============================================================================
-- TROUBLESHOOTING QUERIES
-- ============================================================================

-- Find orphaned auth users (in auth.users but not in users table)
SELECT 
  au.id,
  au.email,
  'Run: INSERT INTO users (id, email, name, role) VALUES (''' || au.id || ''', ''' || au.email || ''', ''Name Here'', ''parent'');' as fix_sql
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
WHERE u.id IS NULL;

-- Find parents without children
SELECT 
  u.id,
  u.email,
  u.name,
  'Run: INSERT INTO children (name, date_of_birth, age_group, parent_user_id) VALUES (''Child Name'', ''2022-01-01'', ''2-3'', ''' || u.id || ''');' as fix_sql
FROM users u
LEFT JOIN children c ON c.parent_user_id = u.id
WHERE u.role = 'parent' AND c.id IS NULL;
