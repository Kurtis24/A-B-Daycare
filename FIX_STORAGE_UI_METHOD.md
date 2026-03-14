# Fix Storage Upload - UI Method (No SQL Needed!)

## 🔴 Problem
Getting error: **"Failed to upload photos: bucket not found"** or **"permission denied"**

The SQL method doesn't work because storage policies must be created through the Supabase UI.

---

## ✅ Solution: Add Policies via UI (5 minutes)

### Step 1: Verify Bucket is Public

1. Go to: https://gaxcmcoqkoaewwvgcbls.supabase.co
2. Click **Storage** in left sidebar
3. Click on the **photos** bucket
4. Click the **Settings** icon (⚙️) or **Configuration** tab
5. Make sure **"Public bucket"** is checked ✅
6. If not checked, check it and click **Save**

---

### Step 2: Add Upload Policy (INSERT)

1. Still in the **photos** bucket, click the **Policies** tab
2. Click **"New policy"** button
3. Click **"For full customization"** (not the templates)
4. Fill in:

**Policy Name**: `Teachers can upload photos`

**Allowed operation**: Check **INSERT** ✅

**Policy definition**:

For **WITH CHECK** field, paste this:
```sql
bucket_id = 'photos' AND (
  SELECT role FROM public.users 
  WHERE id = auth.uid()
) IN ('teacher', 'super_teacher', 'admin')
```

5. Click **Review** then **Save policy**

---

### Step 3: Add View Policy (SELECT)

1. Click **"New policy"** again
2. Click **"For full customization"**
3. Fill in:

**Policy Name**: `Authenticated users can view photos`

**Allowed operation**: Check **SELECT** ✅

**Policy definition**:

For **USING** field, paste this:
```sql
bucket_id = 'photos' AND auth.role() = 'authenticated'
```

4. Click **Review** then **Save policy**

---

### Step 4: Add Delete Policy for Users (DELETE)

1. Click **"New policy"** again
2. Click **"For full customization"**
3. Fill in:

**Policy Name**: `Users can delete own photos`

**Allowed operation**: Check **DELETE** ✅

**Policy definition**:

For **USING** field, paste this:
```sql
bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text
```

4. Click **Review** then **Save policy**

---

### Step 5: Add Delete Policy for Admins (DELETE)

1. Click **"New policy"** again
2. Click **"For full customization"**
3. Fill in:

**Policy Name**: `Admins can delete any photo`

**Allowed operation**: Check **DELETE** ✅

**Policy definition**:

For **USING** field, paste this:
```sql
bucket_id = 'photos' AND (
  SELECT role FROM public.users 
  WHERE id = auth.uid()
) = 'admin'
```

4. Click **Review** then **Save policy**

---

## 📋 Verify Policies

After adding all 4 policies, you should see in the **Policies** tab:

1. ✅ **Teachers can upload photos** (INSERT)
2. ✅ **Authenticated users can view photos** (SELECT)
3. ✅ **Users can delete own photos** (DELETE)
4. ✅ **Admins can delete any photo** (DELETE)

---

## 🧪 Test Upload

1. Go to your app: `http://localhost:5173/new-login`
2. Login as admin
3. Navigate to photo upload page
4. Select photos
5. Tag children
6. Click **Upload Photos**
7. Should work now! ✅

---

## 🎯 Alternative: Simpler Policies (If Above Doesn't Work)

If the policies above are too complex, try these simpler ones:

### Simple Upload Policy:
```sql
bucket_id = 'photos'
```

### Simple View Policy:
```sql
bucket_id = 'photos'
```

### Simple Delete Policy:
```sql
bucket_id = 'photos'
```

**Note**: These are less secure but will allow uploads to work while you troubleshoot.

---

## 🔍 Still Not Working?

### Check Your User Role

Run this in SQL Editor:
```sql
SELECT id, email, role FROM users WHERE email = 'your-admin-email@example.com';
```

Make sure `role` is exactly `'admin'` (lowercase).

If it's wrong or NULL:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

---

### Check if Bucket Exists

Run this in SQL Editor:
```sql
SELECT id, name, public FROM storage.buckets;
```

Should show a bucket named `photos` with `public = true`.

---

### Check Authentication

Make sure you're logged in:
1. Open browser console (F12)
2. Go to Application → Storage → Local Storage
3. Look for Supabase auth token
4. If missing, logout and login again

---

## 📸 Visual Guide

### Where to Add Policies:

```
Supabase Dashboard
└── Storage (left sidebar)
    └── photos (your bucket)
        └── Policies tab
            └── New policy button
                └── For full customization
                    ├── Policy name: [enter name]
                    ├── Allowed operation: [check INSERT/SELECT/DELETE]
                    └── Policy definition: [paste SQL]
```

---

## ⚡ Quick Checklist

Before testing upload:

- [ ] Bucket named `photos` exists
- [ ] Bucket is set to **Public**
- [ ] Added **INSERT** policy (Teachers can upload)
- [ ] Added **SELECT** policy (Users can view)
- [ ] Added **DELETE** policy (Users can delete own)
- [ ] Added **DELETE** policy (Admins can delete any)
- [ ] Your user has role `'admin'` in database
- [ ] Logged out and logged back in
- [ ] Browser cache cleared (Ctrl+Shift+R)

---

## 🎉 Success!

Once all policies are added, you should be able to:
- ✅ Upload photos as admin/teacher
- ✅ View photos in gallery
- ✅ Delete your own photos
- ✅ Admins can delete any photo

---

## 💡 Pro Tip

If you're still having issues, try the **simplest possible policy** first:

1. Go to Storage → photos → Policies
2. Delete all existing policies
3. Create ONE policy:
   - Name: `Allow all operations`
   - Operations: Check ALL (INSERT, SELECT, UPDATE, DELETE)
   - USING: `true`
   - WITH CHECK: `true`

This will allow everything (not secure for production, but good for testing).

Once uploads work, you can add proper restrictive policies.

---

**Your Supabase**: https://gaxcmcoqkoaewwvgcbls.supabase.co  
**Bucket**: photos  
**Public**: Yes ✅  
**Policies**: 4 (INSERT, SELECT, DELETE x2)
