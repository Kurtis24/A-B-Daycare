-- ============================================================================
-- DIAGNOSTIC SCRIPT: Check Storage Bucket Configuration
-- ============================================================================
-- Run these queries in Supabase SQL Editor to diagnose the storage issue

-- 1. Check if 'photos' bucket exists
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE name = 'photos';

-- Expected result: One row with name='photos' and public=true
-- If no results: You need to create the bucket first!

-- ============================================================================
-- 2. Check storage policies for the 'photos' bucket
SELECT 
  id,
  name,
  bucket_id,
  definition,
  check_expression
FROM storage.policies 
WHERE bucket_id = 'photos';

-- Expected: At least 2-4 policies (INSERT, SELECT, DELETE)
-- If no results: You need to add storage policies!

-- ============================================================================
-- 3. Check if your admin user has the correct role
SELECT 
  id,
  email,
  name,
  role
FROM users 
WHERE id = auth.uid();

-- Expected: role should be 'admin' (lowercase)
-- If NULL or wrong role: Update your user role

-- ============================================================================
-- 4. Test if you can insert into storage.objects (simulated)
-- This checks if your RLS policies allow uploads
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'super_teacher', 'admin')
    ) THEN '✅ You have permission to upload'
    ELSE '❌ You do NOT have permission to upload'
  END as upload_permission;

-- ============================================================================
-- 5. Check if bucket is public
SELECT 
  CASE 
    WHEN public = true THEN '✅ Bucket is public (correct)'
    ELSE '❌ Bucket is NOT public (photos won''t display)'
  END as bucket_status
FROM storage.buckets 
WHERE name = 'photos';

-- ============================================================================
-- FIX 1: Create the bucket if it doesn't exist
-- ============================================================================
-- Note: You MUST create the bucket via the Supabase UI first!
-- Go to Storage → New Bucket → Name: "photos" → Public: YES

-- ============================================================================
-- FIX 2: Add storage policies (run AFTER creating the bucket)
-- ============================================================================

-- Delete any existing conflicting policies first
DELETE FROM storage.policies WHERE bucket_id = 'photos';

-- Policy 1: Allow authenticated teachers/admins to INSERT (upload)
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Teachers can upload photos',
  'photos',
  '(bucket_id = ''photos''::text) AND (auth.role() = ''authenticated''::text) AND (EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY[''teacher''::text, ''super_teacher''::text, ''admin''::text])))))',
  'INSERT'
);

-- Policy 2: Allow authenticated users to SELECT (view)
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Authenticated users can view photos',
  'photos',
  '(bucket_id = ''photos''::text) AND (auth.role() = ''authenticated''::text)',
  'SELECT'
);

-- Policy 3: Allow teachers to DELETE their own photos
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Teachers can delete own photos',
  'photos',
  '(bucket_id = ''photos''::text) AND ((auth.uid())::text = (storage.foldername(name))[1])',
  'DELETE'
);

-- Policy 4: Allow admins to DELETE any photo
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Admins can delete any photo',
  'photos',
  '(bucket_id = ''photos''::text) AND (EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND (users.role = ''admin''::text))))',
  'DELETE'
);

-- ============================================================================
-- FIX 3: Verify policies were created
-- ============================================================================
SELECT 
  name,
  operation,
  CASE 
    WHEN definition LIKE '%INSERT%' OR operation = 'INSERT' THEN '✅ Upload policy'
    WHEN definition LIKE '%SELECT%' OR operation = 'SELECT' THEN '✅ View policy'
    WHEN definition LIKE '%DELETE%' OR operation = 'DELETE' THEN '✅ Delete policy'
    ELSE '⚠️ Unknown policy'
  END as policy_type
FROM storage.policies 
WHERE bucket_id = 'photos'
ORDER BY operation;

-- Expected: 4 policies (1 INSERT, 1 SELECT, 2 DELETE)

-- ============================================================================
-- FIX 4: Make sure bucket is public
-- ============================================================================
UPDATE storage.buckets 
SET public = true 
WHERE name = 'photos';

-- Verify it worked
SELECT name, public FROM storage.buckets WHERE name = 'photos';
-- Should show: name='photos', public=true

-- ============================================================================
-- TROUBLESHOOTING: Common Issues
-- ============================================================================

-- Issue 1: "bucket not found"
-- Solution: Create the bucket in Supabase UI (Storage → New Bucket)

-- Issue 2: "new row violates row-level security policy"
-- Solution: Check your user role is correct (should be 'admin', 'teacher', or 'super_teacher')
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Issue 3: "permission denied for bucket"
-- Solution: Add the storage policies above

-- Issue 4: Photos upload but don't display
-- Solution: Make sure bucket is public
UPDATE storage.buckets SET public = true WHERE name = 'photos';

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Run this to see complete status
SELECT 
  'Bucket Exists' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'photos') 
    THEN '✅ YES' 
    ELSE '❌ NO - Create bucket first!' 
  END as status
UNION ALL
SELECT 
  'Bucket is Public',
  CASE 
    WHEN (SELECT public FROM storage.buckets WHERE name = 'photos') = true 
    THEN '✅ YES' 
    ELSE '❌ NO - Set to public!' 
  END
UNION ALL
SELECT 
  'Has Upload Policy',
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'photos' AND operation = 'INSERT') 
    THEN '✅ YES' 
    ELSE '❌ NO - Add INSERT policy!' 
  END
UNION ALL
SELECT 
  'Has View Policy',
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'photos' AND operation = 'SELECT') 
    THEN '✅ YES' 
    ELSE '❌ NO - Add SELECT policy!' 
  END
UNION ALL
SELECT 
  'User Can Upload',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'super_teacher', 'admin')
    ) 
    THEN '✅ YES' 
    ELSE '❌ NO - Check user role!' 
  END;

-- All checks should show ✅ YES for uploads to work!
