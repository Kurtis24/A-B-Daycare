-- SQL Script to Create Test Parent User
-- 
-- INSTRUCTIONS:
-- 1. First create the auth user in Supabase Dashboard:
--    - Go to Authentication > Users
--    - Click "Add user" > "Create new user"
--    - Email: parent@test.com
--    - Password: TestParent123!
--    - Copy the User UID
--
-- 2. Replace 'YOUR_AUTH_USER_UUID' below with the actual UUID
-- 3. Run this script in Supabase SQL Editor

-- Replace this with the actual UUID from Supabase Auth
-- Example: '550e8400-e29b-41d4-a716-446655440000'
DO $$
DECLARE
  parent_uuid UUID := 'YOUR_AUTH_USER_UUID'; -- REPLACE THIS!
BEGIN
  -- Insert parent user record
  INSERT INTO users (id, email, name, role)
  VALUES (parent_uuid, 'parent@test.com', 'Test Parent', 'parent')
  ON CONFLICT (id) DO NOTHING;

  -- Create a child for this parent
  INSERT INTO children (name, date_of_birth, age_group, parent_user_id)
  VALUES ('Emma Johnson', '2022-03-15', '2-3', parent_uuid)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Test parent user and child created successfully!';
END $$;

-- Verify the records were created
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  c.name as child_name,
  c.age_group
FROM users u
LEFT JOIN children c ON c.parent_user_id = u.id
WHERE u.email = 'parent@test.com';
