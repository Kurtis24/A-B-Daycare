# Database Setup Instructions - Create Test Parent User

## 📋 Quick Steps

### Step 1: Check Your Current Database

1. Go to your Supabase project: https://gaxcmcoqkoaewwvgcbls.supabase.co
2. Navigate to **SQL Editor**
3. Run this query to see existing users:

```sql
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.created_at
FROM users u
ORDER BY u.created_at DESC;
```

This will show you all existing users and their roles.

---

### Step 2: Create Auth User in Supabase Dashboard

1. In Supabase, go to **Authentication** → **Users**
2. Click **"Add user"** button
3. Select **"Create new user"**
4. Fill in:
   - **Email**: `parent@test.com`
   - **Password**: `TestParent123!`
   - **Auto Confirm User**: ✅ Check this box
5. Click **"Create user"**
6. **IMPORTANT**: Copy the **User UID** that appears (looks like: `550e8400-e29b-41d4-a716-446655440000`)

---

### Step 3: Add User to Database

Go back to **SQL Editor** and run this (replace `YOUR_UUID_HERE` with the UUID you copied):

```sql
-- Replace YOUR_UUID_HERE with the actual UUID from Step 2
DO $$
DECLARE
  v_auth_uuid UUID := 'YOUR_UUID_HERE'; -- PASTE UUID HERE!
BEGIN
  -- Insert parent user record
  INSERT INTO users (id, email, name, role)
  VALUES (v_auth_uuid, 'parent@test.com', 'Test Parent', 'parent')
  ON CONFLICT (id) DO NOTHING;

  -- Create a child for this parent
  INSERT INTO children (name, date_of_birth, age_group, parent_user_id)
  VALUES ('Emma Johnson', '2022-03-15', '2-3', v_auth_uuid)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Test parent and child created successfully!';
END $$;
```

---

### Step 4: Verify It Worked

Run this query to confirm:

```sql
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
```

You should see:
- Email: `parent@test.com`
- Role: `parent`
- Child Name: `Emma Johnson`
- Age Group: `2-3`

---

### Step 5: Test the Login

1. Open browser: `http://localhost:5173/new-login`
2. Login with:
   - **Email**: `parent@test.com`
   - **Password**: `TestParent123!`
3. You should be redirected to `/gallery` and see "Emma Johnson's Photos"

---

## 🔍 Alternative: Use Existing Users

If you already have users in your database, run this to see them:

```sql
-- See all users and their roles
SELECT 
  u.email,
  u.name,
  u.role,
  CASE 
    WHEN u.role = 'parent' THEN (SELECT COUNT(*) FROM children WHERE parent_user_id = u.id)
    ELSE NULL
  END as child_count
FROM users u
ORDER BY u.role, u.email;
```

Then you can login with any existing user credentials at `/new-login`.

---

## 🐛 Troubleshooting

### Problem: "User already exists" error
**Solution**: The email is already in Supabase Auth. Use a different email or find the existing UUID:

```sql
SELECT id, email FROM auth.users WHERE email = 'parent@test.com';
```

Then use that UUID in Step 3.

---

### Problem: "No child profile found" after login
**Solution**: Create a child for the parent:

```sql
-- Replace PARENT_UUID with the parent's user ID
INSERT INTO children (name, date_of_birth, age_group, parent_user_id)
VALUES ('Emma Johnson', '2022-03-15', '2-3', 'PARENT_UUID');
```

---

### Problem: Can't find the UUID after creating auth user
**Solution**: Query the auth.users table:

```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'parent@test.com';
```

---

## 📊 Useful Queries

### See all auth users and their database status:
```sql
SELECT 
  au.id,
  au.email,
  u.role,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Has user record'
    ELSE '❌ Missing user record'
  END as status
FROM auth.users au
LEFT JOIN users u ON u.id = au.id
ORDER BY au.created_at DESC;
```

### Find parents without children:
```sql
SELECT 
  u.id,
  u.email,
  u.name
FROM users u
LEFT JOIN children c ON c.parent_user_id = u.id
WHERE u.role = 'parent' AND c.id IS NULL;
```

### See all children and their parents:
```sql
SELECT 
  c.name as child_name,
  c.age_group,
  u.email as parent_email,
  u.name as parent_name
FROM children c
LEFT JOIN users u ON u.id = c.parent_user_id
ORDER BY c.name;
```

---

## 🎯 Quick Copy-Paste Template

After creating auth user, just copy this and replace the UUID:

```sql
DO $$
BEGIN
  INSERT INTO users (id, email, name, role)
  VALUES ('PASTE_UUID_HERE', 'parent@test.com', 'Test Parent', 'parent')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO children (name, date_of_birth, age_group, parent_user_id)
  VALUES ('Emma Johnson', '2022-03-15', '2-3', 'PASTE_UUID_HERE')
  ON CONFLICT DO NOTHING;
END $$;
```

---

## ✅ Success Checklist

- [ ] Created auth user in Supabase Dashboard
- [ ] Copied the UUID
- [ ] Ran SQL to insert user record
- [ ] Ran SQL to insert child record
- [ ] Verified with SELECT query
- [ ] Tested login at `/new-login`
- [ ] Can see child's photos in gallery

---

**Your Supabase Project**: https://gaxcmcoqkoaewwvgcbls.supabase.co

**Test Credentials**:
- Email: `parent@test.com`
- Password: `TestParent123!`
