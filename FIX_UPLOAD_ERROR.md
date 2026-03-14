# Fix Upload Error - Step by Step

## 🔴 Error: "Failed to upload photos: bucket not found"

Even though you created the bucket, you likely need to add **storage policies** so users can actually upload to it.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Verify Bucket Exists

1. Go to: https://gaxcmcoqkoaewwvgcbls.supabase.co
2. Click **Storage** in sidebar
3. You should see a bucket named **`photos`**
4. Make sure it's set to **Public** (click the bucket → settings → check "Public bucket")

---

### Step 2: Run Diagnostic Script

Go to **SQL Editor** and run this:

```sql
-- Check if bucket exists and is public
SELECT 
  name,
  public,
  CASE 
    WHEN public = true THEN '✅ Bucket is public (good!)'
    ELSE '❌ Bucket is NOT public (fix this!)'
  END as status
FROM storage.buckets 
WHERE name = 'photos';
```

**Expected Result**: Should show `photos` bucket with `public = true`

If bucket is NOT public, run:
```sql
UPDATE storage.buckets SET public = true WHERE name = 'photos';
```

---

### Step 3: Add Storage Policies

The bucket exists but you need to add **policies** so users can upload. Run this in **SQL Editor**:

```sql
-- First, clean up any existing policies
DELETE FROM storage.policies WHERE bucket_id = 'photos';

-- Policy 1: Allow teachers/admins to upload
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Teachers can upload photos',
  'photos',
  '(bucket_id = ''photos''::text) AND (auth.role() = ''authenticated''::text) AND (EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY[''teacher''::text, ''super_teacher''::text, ''admin''::text])))))',
  'INSERT'
);

-- Policy 2: Allow authenticated users to view
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Authenticated users can view photos',
  'photos',
  '(bucket_id = ''photos''::text) AND (auth.role() = ''authenticated''::text)',
  'SELECT'
);

-- Policy 3: Allow users to delete their own photos
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Users can delete own photos',
  'photos',
  '(bucket_id = ''photos''::text) AND ((auth.uid())::text = (storage.foldername(name))[1])',
  'DELETE'
);

-- Policy 4: Allow admins to delete any photo
INSERT INTO storage.policies (name, bucket_id, definition, operation)
VALUES (
  'Admins can delete any photo',
  'photos',
  '(bucket_id = ''photos''::text) AND (EXISTS ( SELECT 1 FROM public.users WHERE ((users.id = auth.uid()) AND (users.role = ''admin''::text))))',
  'DELETE'
);
```

---

### Step 4: Verify Policies Were Added

Run this to check:

```sql
SELECT 
  name,
  operation
FROM storage.policies 
WHERE bucket_id = 'photos'
ORDER BY operation;
```

**Expected Result**: Should show 4 policies:
- 1 DELETE policy (Admins can delete any photo)
- 1 DELETE policy (Users can delete own photos)
- 1 INSERT policy (Teachers can upload photos)
- 1 SELECT policy (Authenticated users can view photos)

---

### Step 5: Test Upload Again

1. Refresh your browser: `http://localhost:5173`
2. Login as admin
3. Go to upload page
4. Select photos
5. Tag children
6. Click "Upload Photos"
7. Should work now! ✅

---

## 🔍 Still Getting Errors?

### Error: "new row violates row-level security policy"

This means your user doesn't have the right role. Check with:

```sql
SELECT id, email, role FROM users WHERE id = auth.uid();
```

Make sure `role` is one of: `'admin'`, `'teacher'`, or `'super_teacher'` (lowercase!)

If wrong, fix it:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

---

### Error: "permission denied for bucket"

Run the policies script again (Step 3 above).

---

### Photos upload but don't display

Make sure bucket is public:
```sql
UPDATE storage.buckets SET public = true WHERE name = 'photos';
```

---

## 📋 Complete Verification Checklist

Run this query to see everything at once:

```sql
SELECT 
  'Bucket Exists' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'photos') 
    THEN '✅ YES' 
    ELSE '❌ NO' 
  END as status
UNION ALL
SELECT 
  'Bucket is Public',
  CASE 
    WHEN (SELECT public FROM storage.buckets WHERE name = 'photos') = true 
    THEN '✅ YES' 
    ELSE '❌ NO' 
  END
UNION ALL
SELECT 
  'Has Upload Policy',
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'photos' AND operation = 'INSERT') 
    THEN '✅ YES' 
    ELSE '❌ NO' 
  END
UNION ALL
SELECT 
  'Has View Policy',
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'photos' AND operation = 'SELECT') 
    THEN '✅ YES' 
    ELSE '❌ NO' 
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
    ELSE '❌ NO' 
  END;
```

**All 5 checks should show ✅ YES**

---

## 🎯 What Changed in the Code

I also fixed a potential issue in the upload code:

**Before**: Uploaded to `photos/filename.jpg` (nested folder)  
**After**: Uploads to `user-id/filename.jpg` (organized by user)

This is better because:
- Photos are organized by who uploaded them
- Easier to manage user-specific content
- Matches the delete policy structure

---

## 📞 Quick Help

If still stuck, send me the output of:

```sql
-- 1. Check bucket
SELECT * FROM storage.buckets WHERE name = 'photos';

-- 2. Check policies
SELECT name, operation FROM storage.policies WHERE bucket_id = 'photos';

-- 3. Check your user
SELECT email, role FROM users WHERE id = auth.uid();
```

---

**Your Supabase**: https://gaxcmcoqkoaewwvgcbls.supabase.co  
**Bucket Name**: `photos`  
**Must Be**: Public ✅
