# Quick Start Guide

Get the A&B Daycare Photo Sharing Application running in 5 minutes!

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (2-3 minutes)
3. Go to **Project Settings** > **API**
4. Copy your **Project URL** and **anon public** key

## Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Supabase credentials
nano .env
```

Add:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Set Up Database

In Supabase SQL Editor, run this script:

```sql
-- Create Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_teacher', 'teacher', 'parent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Children Table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('0-1', '2-3', '4-5')),
  profile_photo_url TEXT,
  parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Teachers Table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_super_teacher BOOLEAN DEFAULT FALSE,
  assigned_age_groups TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Photos Table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  file_size INTEGER,
  dimensions TEXT,
  deletion_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Photo_Children Junction Table
CREATE TABLE photo_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, child_id)
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_children ENABLE ROW LEVEL SECURITY;

-- Create basic policies (see DATABASE_SCHEMA.md for complete policies)
CREATE POLICY "Users can view own record" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can manage users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Add indexes for performance
CREATE INDEX idx_children_parent_user_id ON children(parent_user_id);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX idx_photos_upload_date ON photos(upload_date DESC);
CREATE INDEX idx_photo_children_photo_id ON photo_children(photo_id);
CREATE INDEX idx_photo_children_child_id ON photo_children(child_id);
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
```

For complete RLS policies, see `DATABASE_SCHEMA.md`.

## Step 5: Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Name it `photos`
4. Make it **Public**
5. Click **Create bucket**

## Step 6: Create First Admin User

1. Go to **Authentication** > **Users** in Supabase
2. Click **Add user**
3. Enter email (e.g., `admin@abdaycare.com`) and password
4. Click **Create user**
5. Copy the user's UUID

In SQL Editor:
```sql
INSERT INTO users (id, email, name, role)
VALUES ('paste-uuid-here', 'admin@abdaycare.com', 'Admin Name', 'admin');
```

## Step 7: Start the Application

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Step 8: Log In

Use the admin credentials you created:
- Email: `admin@abdaycare.com`
- Password: (what you set in step 6)

## Next Steps

### Create Users

1. Log in as admin
2. Go to **Admin Dashboard** > **Manage Users**
3. Click **+ Create User**
4. Create:
   - Parent accounts
   - Teacher accounts
   - Super teacher accounts

### Add Children

1. Go to **Admin Dashboard** > **Manage Children**
2. Click **+ Add Child**
3. Fill in child details
4. Assign to a parent account

### Upload Photos (as Teacher)

1. Log in as a teacher
2. Go to **Photo Gallery**
3. Click **+ Upload Photos**
4. Select photos
5. Tag children
6. Click **Upload**

### View Photos (as Parent)

1. Log in as a parent
2. View your child's photos in the gallery
3. Click to view full size
4. Download individual or multiple photos

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env` file exists
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
- Restart dev server

### "Could not create user"
- Check RLS policies are enabled
- Verify admin user exists in users table
- Check browser console for errors

### Photos not uploading
- Verify storage bucket `photos` exists
- Check bucket is public
- Verify you're logged in as teacher/super_teacher/admin

### Can't log in
- Verify user exists in Supabase Auth
- Verify user record exists in users table with correct role
- Check Supabase credentials in .env

## Default Test Data (Optional)

Create test accounts for each role:

```sql
-- After creating these users in Supabase Auth, add to users table:

-- Parent user
INSERT INTO users (id, email, name, role) 
VALUES ('parent-uuid', 'parent@test.com', 'Test Parent', 'parent');

-- Teacher user
INSERT INTO users (id, email, name, role) 
VALUES ('teacher-uuid', 'teacher@test.com', 'Test Teacher', 'teacher');

-- Teacher record
INSERT INTO teachers (user_id, is_super_teacher, assigned_age_groups)
VALUES ('teacher-uuid', false, ARRAY['0-1', '2-3']);

-- Super teacher user
INSERT INTO users (id, email, name, role)
VALUES ('super-uuid', 'super@test.com', 'Test Super', 'super_teacher');

-- Super teacher record
INSERT INTO teachers (user_id, is_super_teacher)
VALUES ('super-uuid', true);

-- Test child
INSERT INTO children (name, date_of_birth, age_group, parent_user_id)
VALUES ('Test Child', '2024-01-15', '0-1', 'parent-uuid');
```

## Video Tutorial

(Coming soon - link to video walkthrough)

## Need Help?

- Check `README.md` for detailed documentation
- See `DATABASE_SCHEMA.md` for complete database setup
- Review `DEPLOYMENT.md` for production deployment
- Contact: support@abdaycare.com

---

**Time to complete**: ~5 minutes  
**Difficulty**: Beginner  
**Last updated**: February 8, 2026
