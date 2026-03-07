# Database Schema and Setup Guide

## Overview
This document outlines the database schema for the A&B Daycare Photo Sharing Application using Supabase (PostgreSQL).

## Tables

### 1. Users Table
Stores all user accounts (admins, teachers, parents).

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_teacher', 'teacher', 'parent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Children Table
Stores child profiles.

```sql
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('0-1', '2-3', '4-5')),
  profile_photo_url TEXT,
  parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Teachers Table
Stores teacher-specific information.

```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_super_teacher BOOLEAN DEFAULT FALSE,
  assigned_age_groups TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Photos Table
Stores photo metadata.

```sql
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
```

### 5. Photo_Children Table (Junction Table)
Links photos to children (many-to-many relationship).

```sql
CREATE TABLE photo_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, child_id)
);
```

## Row Level Security (RLS) Policies

### Users Table Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admins can see all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Admins can insert users
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update users
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Children Table Policies

```sql
-- Enable RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Parents can view their own children
CREATE POLICY "Parents can view their children"
  ON children FOR SELECT
  USING (parent_user_id = auth.uid());

-- Teachers can view children in their age groups
CREATE POLICY "Teachers can view assigned children"
  ON children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        users.role = 'admin'
        OR users.role = 'super_teacher'
        OR (
          users.role = 'teacher'
          AND EXISTS (
            SELECT 1 FROM teachers
            WHERE teachers.user_id = auth.uid()
            AND children.age_group = ANY(teachers.assigned_age_groups)
          )
        )
      )
    )
  );

-- Admins can manage all children
CREATE POLICY "Admins can manage children"
  ON children FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Teachers Table Policies

```sql
-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own record
CREATE POLICY "Teachers can view own record"
  ON teachers FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all teacher records
CREATE POLICY "Admins can manage teachers"
  ON teachers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Photos Table Policies

```sql
-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Teachers can view photos from their assigned age groups
CREATE POLICY "Teachers can view assigned photos"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        users.role = 'admin'
        OR users.role = 'super_teacher'
        OR (
          users.role = 'teacher'
          AND EXISTS (
            SELECT 1 FROM photo_children
            JOIN children ON children.id = photo_children.child_id
            JOIN teachers ON teachers.user_id = auth.uid()
            WHERE photo_children.photo_id = photos.id
            AND children.age_group = ANY(teachers.assigned_age_groups)
          )
        )
      )
    )
    OR
    -- Parents can view photos of their children
    EXISTS (
      SELECT 1 FROM photo_children
      JOIN children ON children.id = photo_children.child_id
      WHERE photo_children.photo_id = photos.id
      AND children.parent_user_id = auth.uid()
    )
  );

-- Teachers can insert photos
CREATE POLICY "Teachers can upload photos"
  ON photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('teacher', 'super_teacher', 'admin')
    )
  );

-- Teachers can delete their own photos
CREATE POLICY "Teachers can delete own photos"
  ON photos FOR DELETE
  USING (uploaded_by = auth.uid());

-- Admins can delete any photo
CREATE POLICY "Admins can delete any photo"
  ON photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Photo_Children Table Policies

```sql
-- Enable RLS
ALTER TABLE photo_children ENABLE ROW LEVEL SECURITY;

-- Same view policies as photos
CREATE POLICY "View photo-children links"
  ON photo_children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        users.role IN ('admin', 'super_teacher')
        OR (
          users.role = 'teacher'
          AND EXISTS (
            SELECT 1 FROM children
            JOIN teachers ON teachers.user_id = auth.uid()
            WHERE children.id = photo_children.child_id
            AND children.age_group = ANY(teachers.assigned_age_groups)
          )
        )
        OR EXISTS (
          SELECT 1 FROM children
          WHERE children.id = photo_children.child_id
          AND children.parent_user_id = auth.uid()
        )
      )
    )
  );

-- Teachers can create photo-children links
CREATE POLICY "Teachers can create links"
  ON photo_children FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('teacher', 'super_teacher', 'admin')
    )
  );

-- Photos deletion cascades to photo_children
CREATE POLICY "Delete photo-children links"
  ON photo_children FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_children.photo_id
      AND (
        photos.uploaded_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );
```

## Storage Bucket Setup

### Photos Bucket
Create a storage bucket named `photos` in Supabase Storage.

**Storage Policies:**

```sql
-- Teachers can upload photos
CREATE POLICY "Teachers can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('teacher', 'super_teacher', 'admin')
    )
  );

-- Users can view photos based on table policies
CREATE POLICY "Users can view photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photos'
    AND auth.role() = 'authenticated'
  );

-- Teachers can delete their uploaded photos
CREATE POLICY "Teachers can delete own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can delete any photo
CREATE POLICY "Admins can delete any photo"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Indexes for Performance

```sql
-- Index on children's parent_user_id
CREATE INDEX idx_children_parent_user_id ON children(parent_user_id);

-- Index on photos uploaded_by
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);

-- Index on photos upload_date for sorting
CREATE INDEX idx_photos_upload_date ON photos(upload_date DESC);

-- Index on photo_children junction table
CREATE INDEX idx_photo_children_photo_id ON photo_children(photo_id);
CREATE INDEX idx_photo_children_child_id ON photo_children(child_id);

-- Index on teachers user_id
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
```

## Functions

### Auto-delete old photos (scheduled job)
This function can be set up as a Supabase Edge Function or cron job to automatically delete photos after 2 years.

```sql
CREATE OR REPLACE FUNCTION delete_old_photos()
RETURNS void AS $$
BEGIN
  -- Get photos to delete
  DELETE FROM photos
  WHERE deletion_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Setup Instructions

1. **Create Tables**: Run all CREATE TABLE statements in the Supabase SQL Editor.

2. **Enable RLS**: Run all ALTER TABLE statements to enable RLS.

3. **Create Policies**: Run all CREATE POLICY statements.

4. **Create Indexes**: Run all CREATE INDEX statements.

5. **Create Storage Bucket**: 
   - Go to Supabase Storage
   - Create a public bucket named `photos`
   - Apply the storage policies

6. **Create First Admin User**:
   ```sql
   -- After creating an auth user through Supabase Auth UI
   INSERT INTO users (id, email, name, role)
   VALUES ('user-uuid-from-auth', 'admin@example.com', 'Admin Name', 'admin');
   ```

7. **Set up Scheduled Job**: Configure a cron job to run `delete_old_photos()` daily.

## Testing RLS Policies

Test policies by executing queries as different users:

```sql
-- Set the auth.uid() for testing
SELECT set_config('request.jwt.claims', '{"sub": "user-uuid-here"}', true);

-- Then run your queries to test access
```

## Backup and Maintenance

- Enable Supabase automatic backups
- Regular exports of database for disaster recovery
- Monitor storage usage
- Review and audit RLS policies regularly
