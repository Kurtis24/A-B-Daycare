# Fix Storage Bucket Error - "bucket not found"

## 🔴 Problem
Getting error: **"Failed to upload photos: bucket not found"**

This means the Supabase storage bucket for photos hasn't been created yet.

---

## ✅ Solution: Create the Storage Bucket

### Step 1: Create the Bucket

1. Go to your Supabase project: https://gaxcmcoqkoaewwvgcbls.supabase.co
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** button
4. Fill in:
   - **Name**: `photos` (must be exactly this name)
   - **Public bucket**: ✅ **Check this box** (photos need to be publicly accessible)
   - **File size limit**: 10 MB (optional but recommended)
   - **Allowed MIME types**: Leave empty or add: `image/jpeg, image/png, image/jpg, image/heic`
5. Click **"Create bucket"**

---

### Step 2: Set Up Storage Policies

After creating the bucket, you need to add policies so users can upload and view photos.

Go to **Storage** → Click on **"photos"** bucket → Click **"Policies"** tab → Click **"New policy"**

#### Policy 1: Teachers Can Upload Photos

Click **"New policy"** → **"For full customization"**

```sql
CREATE POLICY "Teachers can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('teacher', 'super_teacher', 'admin')
  )
);
```

**Or use the UI:**
- Policy name: `Teachers can upload photos`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- USING expression: Leave empty
- WITH CHECK expression:
```sql
bucket_id = 'photos' AND EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid()
  AND role IN ('teacher', 'super_teacher', 'admin')
)
```

---

#### Policy 2: Authenticated Users Can View Photos

```sql
CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos'
  AND auth.role() = 'authenticated'
);
```

**Or use the UI:**
- Policy name: `Authenticated users can view photos`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- USING expression:
```sql
bucket_id = 'photos'
```

---

#### Policy 3: Teachers Can Delete Their Own Photos

```sql
CREATE POLICY "Teachers can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Or use the UI:**
- Policy name: `Teachers can delete own photos`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
```sql
bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]
```

---

#### Policy 4: Admins Can Delete Any Photo

```sql
CREATE POLICY "Admins can delete any photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

**Or use the UI:**
- Policy name: `Admins can delete any photo`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
```sql
bucket_id = 'photos' AND EXISTS (
  SELECT 1 FROM public.users
  WHERE id = auth.uid() AND role = 'admin'
)
```

---

### Step 3: Verify the Bucket

1. Go to **Storage** → **photos** bucket
2. You should see it listed with:
   - ✅ Public bucket
   - ✅ 4 policies created
3. Try uploading a test file manually to verify it works

---

## 🧪 Test Photo Upload

After setting up the bucket:

1. Login as admin at: `http://localhost:5173/new-login`
2. Go to photo upload page
3. Try uploading photos again
4. Should work without errors!

---

## 🚀 Quick Setup (SQL Method)

If you prefer to set everything up via SQL, go to **SQL Editor** and run:

```sql
-- Note: You still need to create the bucket manually in the UI first!
-- After creating the bucket, run these policies:

-- Policy 1: Teachers can upload
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Teachers can upload photos',
  'photos',
  'bucket_id = ''photos'' AND auth.role() = ''authenticated'' AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN (''teacher'', ''super_teacher'', ''admin'')
  )'
);

-- Policy 2: Authenticated users can view
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Authenticated users can view photos',
  'photos',
  'bucket_id = ''photos'' AND auth.role() = ''authenticated'''
);

-- Policy 3: Teachers can delete own photos
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Teachers can delete own photos',
  'photos',
  'bucket_id = ''photos'' AND auth.uid()::text = (storage.foldername(name))[1]'
);

-- Policy 4: Admins can delete any photo
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Admins can delete any photo',
  'photos',
  'bucket_id = ''photos'' AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = ''admin''
  )'
);
```

---

## 🔍 Verify Bucket Exists

Run this in SQL Editor to check if bucket exists:

```sql
SELECT * FROM storage.buckets WHERE name = 'photos';
```

Should return one row with:
- name: `photos`
- public: `true`

---

## 📋 Checklist

- [ ] Created `photos` bucket in Supabase Storage
- [ ] Set bucket to **Public**
- [ ] Added policy: "Teachers can upload photos"
- [ ] Added policy: "Authenticated users can view photos"
- [ ] Added policy: "Teachers can delete own photos"
- [ ] Added policy: "Admins can delete any photo"
- [ ] Tested upload from admin account
- [ ] Photos display in gallery

---

## 🐛 Still Having Issues?

### Issue: "Failed to upload photos: new row violates row-level security policy"
**Solution**: Check that your admin user has the correct role in the database:

```sql
SELECT id, email, role FROM users WHERE email = 'your-admin@email.com';
```

Make sure `role` is `'admin'` (not `'Admin'` - case matters!)

---

### Issue: "Permission denied for bucket"
**Solution**: Make sure the bucket is set to **Public**:

1. Go to Storage → photos bucket
2. Click settings (gear icon)
3. Check "Public bucket"
4. Save

---

### Issue: Photos upload but don't display
**Solution**: Check the storage policies allow SELECT:

```sql
-- Run this to see all policies
SELECT * FROM storage.policies WHERE bucket_id = 'photos';
```

Should have at least one policy with `SELECT` operation.

---

## 📚 Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)

---

**Your Supabase Project**: https://gaxcmcoqkoaewwvgcbls.supabase.co  
**Bucket Name**: `photos` (must be exact)  
**Public**: Yes (required for photo viewing)
