-- ============================================
-- A&B Daycare Database Setup Script
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_teacher', 'teacher', 'parent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Children Table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('0-1', '2-3', '4-5')),
  profile_photo_url TEXT,
  parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers Table
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_super_teacher BOOLEAN DEFAULT FALSE,
  assigned_age_groups TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos Table
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

-- Photo_Children Junction Table
CREATE TABLE photo_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, child_id)
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_children ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES - USERS TABLE
-- ============================================

-- Users can view their own record
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

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

-- ============================================
-- 4. CREATE RLS POLICIES - CHILDREN TABLE
-- ============================================

-- Parents can view their own children
CREATE POLICY "Parents can view their children"
  ON children FOR SELECT
  USING (parent_user_id = auth.uid());

-- Teachers can view children in their age groups or all if super teacher/admin
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
CREATE POLICY "Admins can insert children"
  ON children FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update children"
  ON children FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete children"
  ON children FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 5. CREATE RLS POLICIES - TEACHERS TABLE
-- ============================================

-- Teachers can view their own record
CREATE POLICY "Teachers can view own record"
  ON teachers FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all teachers
CREATE POLICY "Admins can view all teachers"
  ON teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage teacher records
CREATE POLICY "Admins can insert teachers"
  ON teachers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update teachers"
  ON teachers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete teachers"
  ON teachers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 6. CREATE RLS POLICIES - PHOTOS TABLE
-- ============================================

-- Teachers and parents can view photos they have access to
CREATE POLICY "Users can view authorized photos"
  ON photos FOR SELECT
  USING (
    -- Admins can see all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
    OR
    -- Super teachers can see all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'super_teacher'
    )
    OR
    -- Regular teachers can see photos from their assigned age groups
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'teacher'
      )
      AND EXISTS (
        SELECT 1 FROM photo_children
        JOIN children ON children.id = photo_children.child_id
        JOIN teachers ON teachers.user_id = auth.uid()
        WHERE photo_children.photo_id = photos.id
        AND children.age_group = ANY(teachers.assigned_age_groups)
      )
    )
    OR
    -- Parents can see photos of their children
    EXISTS (
      SELECT 1 FROM photo_children
      JOIN children ON children.id = photo_children.child_id
      WHERE photo_children.photo_id = photos.id
      AND children.parent_user_id = auth.uid()
    )
  );

-- Teachers can upload photos
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

-- ============================================
-- 7. CREATE RLS POLICIES - PHOTO_CHILDREN TABLE
-- ============================================

-- Users can view photo-children links they have access to
CREATE POLICY "Users can view photo-children links"
  ON photo_children FOR SELECT
  USING (
    -- Admins and super teachers can see all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_teacher')
    )
    OR
    -- Regular teachers can see links for their assigned age groups
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'teacher'
      )
      AND EXISTS (
        SELECT 1 FROM children
        JOIN teachers ON teachers.user_id = auth.uid()
        WHERE children.id = photo_children.child_id
        AND children.age_group = ANY(teachers.assigned_age_groups)
      )
    )
    OR
    -- Parents can see links for their children
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = photo_children.child_id
      AND children.parent_user_id = auth.uid()
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

-- Allow deletion when parent photo is deleted
CREATE POLICY "Delete photo-children links with photos"
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

-- ============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_children_parent_user_id ON children(parent_user_id);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX idx_photos_upload_date ON photos(upload_date DESC);
CREATE INDEX idx_photo_children_photo_id ON photo_children(photo_id);
CREATE INDEX idx_photo_children_child_id ON photo_children(child_id);
CREATE INDEX idx_teachers_user_id ON teachers(user_id);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Go to Storage and create a bucket named 'photos' (make it public)
-- 2. Create your first admin user in Authentication
-- 3. Insert the admin user record into the users table
-- ============================================
