-- ============================================
-- Create Admin User Record
-- ============================================
-- INSTRUCTIONS:
-- 1. First create the user in Authentication > Users
-- 2. Copy the user's UUID
-- 3. Replace 'PASTE-USER-UUID-HERE' below with the actual UUID
-- 4. Update the email and name if needed
-- 5. Run this script in SQL Editor
-- ============================================

-- Insert admin user into users table
INSERT INTO users (id, email, name, role)
VALUES (
  'PASTE-USER-UUID-HERE',  -- Replace with UUID from Auth
  'admin@abdaycare.com',    -- Your email
  'Admin User',             -- Your name
  'admin'                   -- Role
);

-- Verify the user was created
SELECT * FROM users WHERE role = 'admin';

-- ============================================
-- You can now log in with:
-- Email: admin@abdaycare.com
-- Password: (whatever you set in Step 1)
-- ============================================
