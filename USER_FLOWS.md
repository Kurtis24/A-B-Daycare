# User Flows and Navigation

Visual guide to how different users interact with the application.

## Authentication Flow

```
┌─────────────────┐
│   Login Page    │
│  /login         │
└────────┬────────┘
         │
         │ Credentials
         ▼
┌─────────────────┐
│  Verify User    │
│  (Supabase)     │
└────────┬────────┘
         │
         │ Success
         ▼
┌─────────────────┐
│  Fetch Role     │
│  from users     │
└────────┬────────┘
         │
         ├─── Admin ────────► Admin Dashboard
         │
         ├─── Teacher ──────► Teacher Gallery
         │
         ├─── Super Teacher ► Teacher Gallery
         │
         └─── Parent ───────► Parent Gallery
```

## Admin User Flow

```
┌────────────────────────┐
│   Admin Dashboard      │
│   /admin/dashboard     │
│                        │
│  ┌──────────────────┐ │
│  │ System Stats     │ │
│  │ - Users: 45      │ │
│  │ - Children: 52   │ │
│  │ - Photos: 1,234  │ │
│  └──────────────────┘ │
│                        │
│  ┌──────────────────┐ │
│  │ Quick Actions    │ │
│  └──────────────────┘ │
└───┬────────┬──────┬───┘
    │        │      │
    │        │      └────► View All Photos
    │        │
    │        └───────────► Manage Children
    │                      /admin/children
    │                      │
    │                      ├─► Add Child
    │                      ├─► Assign to Parent
    │                      └─► Set Age Group
    │
    └────────────────────► Manage Users
                          /admin/users
                          │
                          ├─► Create User
                          ├─► Set Role
                          ├─► Assign Teachers to Age Groups
                          └─► Reset Password
```

## Teacher User Flow

```
┌────────────────────────┐
│   Teacher Gallery      │
│   /teacher/gallery     │
│                        │
│  ┌──────────────────┐ │
│  │ Filters          │ │
│  │ - Age Group      │ │
│  │ - Child          │ │
│  │ - Date Range     │ │
│  └──────────────────┘ │
│                        │
│  ┌──────────────────┐ │
│  │ Photo Grid       │ │
│  │ [📷][📷][📷]     │ │
│  │ [📷][📷][📷]     │ │
│  └──────────────────┘ │
└───┬────────────────┬───┘
    │                │
    │                └─► Click Photo
    │                    │
    │                    ▼
    │                   ┌────────────────┐
    │                   │ Photo Viewer   │
    │                   │ - Full size    │
    │                   │ - Details      │
    │                   │ - Delete (own) │
    │                   └────────────────┘
    │
    └─► Upload Photos
        /teacher/upload
        │
        ├─► 1. Select Photos
        │   - Drag & drop
        │   - File picker
        │   - Preview
        │
        ├─► 2. Tag Children
        │   - Filter by age group
        │   - Select children
        │   - Select all option
        │
        └─► 3. Upload
            - Progress bar
            - Success message
            - Redirect to gallery
```

## Parent User Flow

```
┌────────────────────────┐
│   Parent Gallery       │
│   /parent/gallery      │
│                        │
│  ┌──────────────────┐ │
│  │ Child Info       │ │
│  │ 👶 Emma Smith    │ │
│  │ 234 photos       │ │
│  └──────────────────┘ │
│                        │
│  ┌──────────────────┐ │
│  │ Photo Grid       │ │
│  │ [📷][📷][📷]     │ │
│  │ [📷][📷][📷]     │ │
│  │ [📷][📷][📷]     │ │
│  └──────────────────┘ │
└───┬────────────────┬───┘
    │                │
    │                └─► Select Mode
    │                    │
    │                    ├─► Select photos
    │                    ├─► Download selected
    │                    └─► Cancel
    │
    └─► Click Photo
        │
        ▼
       ┌────────────────┐
       │ Photo Viewer   │
       │ - Full size    │
       │ - Upload date  │
       │ - Uploader     │
       │ - Download btn │
       └────────────────┘
```

## Photo Upload Flow (Detailed)

```
Teacher → Upload Page
│
├─► Step 1: Select Files
│   │
│   ├─► File picker opens
│   ├─► Select multiple photos
│   ├─► Validate: size (<10MB), type (image)
│   └─► Show previews in grid
│
├─► Step 2: Tag Children
│   │
│   ├─► Show children based on:
│   │   - Teacher's assigned age groups (regular teacher)
│   │   - All children (super teacher)
│   │
│   ├─► Filter by age group dropdown
│   │
│   ├─► Click children to tag (checkboxes)
│   │
│   └─► Select All / Deselect All buttons
│
└─► Step 3: Upload
    │
    ├─► Click "Upload Photos" button
    │
    ├─► For each photo:
    │   │
    │   ├─► Upload to Supabase Storage
    │   │   - Path: /photos/{unique-id}.jpg
    │   │   - Generate thumbnail (optional)
    │   │
    │   ├─► Create photo record in database
    │   │   - file_path
    │   │   - uploaded_by (teacher id)
    │   │   - upload_date
    │   │   - deletion_date (+2 years)
    │   │
    │   └─► Create photo_children links
    │       - photo_id → child_id (for each tagged child)
    │
    ├─► Show progress: "2/5 uploaded"
    │
    ├─► Success: "All photos uploaded!"
    │
    └─► Redirect to gallery
```

## Photo Viewing with RLS

```
User Requests Photos
│
├─► Database Query: SELECT photos...
│
├─► RLS Policy Checks:
│   │
│   ├─► IF user.role = 'parent':
│   │   └─► ONLY photos WHERE child.parent_id = user.id
│   │
│   ├─► IF user.role = 'teacher':
│   │   └─► ONLY photos WHERE child.age_group IN teacher.assigned_age_groups
│   │
│   ├─► IF user.role = 'super_teacher':
│   │   └─► ALL photos
│   │
│   └─► IF user.role = 'admin':
│       └─► ALL photos
│
└─► Return Authorized Photos Only
```

## Navigation Structure

```
Application Root (/)
│
├─► Public Routes
│   ├─► /login
│   ├─► /forgot-password
│   └─► /unauthorized
│
├─► Protected Routes (authenticated)
│   └─► /dashboard (redirects based on role)
│
├─► Admin Routes (role: admin)
│   ├─► /admin/dashboard
│   ├─► /admin/users
│   ├─► /admin/children
│   └─► /admin/photos
│
├─► Teacher Routes (role: teacher, super_teacher, admin)
│   ├─► /teacher/gallery
│   └─► /teacher/upload
│
└─► Parent Routes (role: parent)
    └─► /parent/gallery
```

## Data Access Patterns

### Parent Viewing Photos

```
1. Parent logs in → auth.uid() = 'parent-123'

2. Query: Get my child
   SELECT * FROM children 
   WHERE parent_user_id = 'parent-123'
   → Returns: child-456

3. Query: Get child's photos
   SELECT photos.* FROM photos
   JOIN photo_children ON photo_children.photo_id = photos.id
   WHERE photo_children.child_id = 'child-456'
   → RLS ensures only authorized photos

4. Display photos in gallery
```

### Teacher Viewing Photos

```
1. Teacher logs in → auth.uid() = 'teacher-789'

2. Query: Get teacher info
   SELECT assigned_age_groups FROM teachers
   WHERE user_id = 'teacher-789'
   → Returns: ['0-1', '2-3']

3. Query: Get photos from assigned age groups
   SELECT DISTINCT photos.* FROM photos
   JOIN photo_children ON photo_children.photo_id = photos.id
   JOIN children ON children.id = photo_children.child_id
   WHERE children.age_group IN ('0-1', '2-3')
   → RLS enforces this automatically

4. Display photos in gallery with filters
```

### Admin Full Access

```
1. Admin logs in → auth.uid() = 'admin-001'

2. RLS Policy: IF role = 'admin' THEN allow ALL

3. Query: Get all photos
   SELECT * FROM photos
   → Returns all photos (no restrictions)

4. Can view, manage, delete any photo
```

## Mobile Interaction Patterns

### Mobile Gallery (Parent/Teacher)

```
┌─────────────────────────┐
│  A&B Daycare    [Logout]│ ← Sticky Header
├─────────────────────────┤
│                         │
│  👶 Emma Smith          │ ← Child info
│  234 photos             │
│                         │
│  [Select Photos]        │ ← Action button
│                         │
├─────────────────────────┤
│ [📷] [📷] [📷]         │ ← 3-column grid
│ [📷] [📷] [📷]         │   (mobile)
│ [📷] [📷] [📷]         │
│ [📷] [📷] [📷]         │
│      ...                │
│                         │
└─────────────────────────┘
     ↕ Scroll
```

### Touch Interactions

- **Tap photo** → Open full-screen viewer
- **Tap "Select Photos"** → Enter selection mode
- **Tap photo in selection mode** → Toggle selection
- **Swipe left/right** → Navigate photos (future)
- **Pinch to zoom** → Zoom photo (future)
- **Pull down** → Refresh gallery (future)

## Error Handling Flows

### Upload Error

```
User uploads photo
│
├─► File too large (>10MB)
│   └─► Show error: "Photo must be under 10MB"
│
├─► Invalid file type
│   └─► Show error: "Only images are allowed"
│
├─► Network error
│   └─► Show error: "Upload failed. Check connection."
│
└─► No children selected
    └─► Show error: "Please select at least one child"
```

### Login Error

```
User tries to login
│
├─► Invalid credentials
│   └─► Show error: "Invalid email or password"
│
├─► User not found in users table
│   └─► Show error: "Account not set up. Contact admin."
│
├─► Network error
│   └─► Show error: "Connection failed. Try again."
│
└─► Session expired
    └─► Redirect to login with message
```

## Feature Access Matrix

| Feature                  | Parent | Teacher | Super Teacher | Admin |
|-------------------------|--------|---------|---------------|-------|
| View own child's photos | ✅     | ❌      | ❌            | ✅    |
| View assigned age groups| ❌     | ✅      | ❌            | ✅    |
| View all photos         | ❌     | ❌      | ✅            | ✅    |
| Upload photos           | ❌     | ✅      | ✅            | ✅    |
| Delete own photos       | ❌     | ✅      | ✅            | ✅    |
| Delete any photo        | ❌     | ❌      | ❌            | ✅    |
| Download photos         | ✅     | ✅      | ✅            | ✅    |
| Create users            | ❌     | ❌      | ❌            | ✅    |
| Manage children         | ❌     | ❌      | ❌            | ✅    |
| View statistics         | ❌     | ❌      | ❌            | ✅    |

---

This document provides a visual reference for understanding how users interact with the application and how data flows through the system.
