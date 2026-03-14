# Testing Guide for New Login and Tabbed Gallery

## Overview
This guide provides instructions for testing the new login page and tabbed gallery functionality.

## What Was Implemented

### 1. New Login Page (`/new-login`)
- Modern gradient design with purple/indigo theme
- Card-based layout with backdrop blur
- Animated loading states
- Redirects to `/gallery` after successful login

### 2. Tabbed Gallery Page (`/gallery`)
- Role-based tab navigation
- Three tab configurations based on user role:
  - **Parents**: Single "My Child's Photos" tab
  - **Teachers**: Single "My Gallery" tab  
  - **Super Teachers/Admins**: "My Gallery" + "All Photos" tabs

### 3. Reusable Components
- **PhotoGrid**: Extracted photo grid with selection mode
- **PhotoModal**: Extracted photo viewer with download/delete actions

## Test User Setup

### Creating a Test Parent User

To test the parent role, you need to create a parent user in Supabase:

#### Step 1: Create Auth User in Supabase Dashboard
1. Go to your Supabase project
2. Navigate to Authentication > Users
3. Click "Add user" > "Create new user"
4. Email: `parent@test.com`
5. Password: `TestParent123!`
6. Click "Create user"
7. Copy the User UID (you'll need this)

#### Step 2: Run SQL in Supabase SQL Editor

Replace `YOUR_AUTH_USER_UUID` with the UUID from Step 1:

```sql
-- Insert parent user record
INSERT INTO users (id, email, name, role)
VALUES ('YOUR_AUTH_USER_UUID', 'parent@test.com', 'Test Parent', 'parent');

-- Create a child for this parent
INSERT INTO children (name, date_of_birth, age_group, parent_user_id)
VALUES ('Emma Johnson', '2022-03-15', '2-3', 'YOUR_AUTH_USER_UUID');
```

#### Step 3: (Optional) Add Test Photos

To see photos in the gallery, you'll need to:
1. Login as a teacher/admin user
2. Upload photos via `/teacher/upload`
3. Tag the child "Emma Johnson" in the photos

## Testing Checklist

### Test 1: New Login Page
- [ ] Navigate to `http://localhost:5173/new-login`
- [ ] Verify modern gradient background (purple/indigo/pink)
- [ ] Verify card has backdrop blur effect
- [ ] Enter invalid credentials - should show error message
- [ ] Enter valid parent credentials (`parent@test.com` / `TestParent123!`)
- [ ] Should redirect to `/gallery` after successful login

### Test 2: Parent Gallery View
After logging in as parent:
- [ ] Should see single tab: "My Child's Photos"
- [ ] Should see child's name and avatar in header
- [ ] Should see photo count
- [ ] If photos exist, should see photo grid
- [ ] Click "Select Photos" button
- [ ] Select multiple photos (checkmarks should appear)
- [ ] Click "Download" button - photos should download
- [ ] Click photo to open modal viewer
- [ ] Verify download button works in modal
- [ ] Close modal with X button or click outside

### Test 3: Teacher Gallery View
Login as teacher user:
- [ ] Should see single tab: "My Gallery"
- [ ] Should see age group and child filters
- [ ] Filter by age group - photos should update
- [ ] Filter by specific child - photos should update
- [ ] Click "+ Upload Photos" button - should navigate to upload page
- [ ] Click photo to open modal
- [ ] Should see tagged children in modal
- [ ] If photo was uploaded by this teacher, should see delete button
- [ ] Delete button should work and remove photo

### Test 4: Super Teacher/Admin Gallery View
Login as super teacher or admin:
- [ ] Should see two tabs: "My Gallery" and "All Photos"
- [ ] Click "My Gallery" tab
  - [ ] Should show photos from assigned age groups (or all for super teacher)
  - [ ] Filters should work
- [ ] Click "All Photos" tab
  - [ ] Should show all photos across all age groups
  - [ ] Filters should work
  - [ ] Can upload photos
  - [ ] Can delete own photos

### Test 5: Tab Switching
- [ ] Switch between tabs - content should update
- [ ] Filters should reset when switching tabs
- [ ] Loading state should show while fetching data
- [ ] Selected photos should clear when switching tabs

### Test 6: Responsive Design
- [ ] Test on mobile viewport (375px - 428px)
- [ ] Tabs should scroll horizontally if needed
- [ ] Photo grid should be responsive (3 cols on mobile, 6 on desktop)
- [ ] Modal should be centered and responsive
- [ ] Buttons should be touch-friendly (44x44px minimum)

### Test 7: Edge Cases
- [ ] Parent with no child assigned - should show error message
- [ ] Gallery with no photos - should show empty state
- [ ] Network error during photo fetch - should handle gracefully
- [ ] Logout and login with different role - tabs should update

## Existing Routes (Should Still Work)

The implementation maintains backward compatibility:
- [ ] `/login` - Original login page still works
- [ ] `/parent/gallery` - Original parent gallery still works
- [ ] `/teacher/gallery` - Original teacher gallery still works
- [ ] `/admin/photos` - Admin photos page still works

## Common Issues and Solutions

### Issue: "No child profile found"
**Solution**: Make sure you created a child record linked to the parent user in the database.

### Issue: Photos not displaying
**Solution**: 
1. Check Supabase Storage bucket is public
2. Verify photos exist in database
3. Check browser console for errors

### Issue: Cannot delete photos
**Solution**: Users can only delete their own uploaded photos. Make sure you're logged in as the user who uploaded the photo.

### Issue: Tabs not showing correctly
**Solution**: 
1. Check user role in database
2. For teachers, verify `teachers` table record exists
3. Clear browser cache and reload

## Test Credentials Summary

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Parent | parent@test.com | TestParent123! | Created in this guide |
| Admin | admin@abdaycare.com | (your password) | Should already exist |
| Teacher | (varies) | (varies) | Check your database |

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Testing

- [ ] Photo grid loads smoothly with 50+ photos
- [ ] Lazy loading works (images load as you scroll)
- [ ] Tab switching is instant (no unnecessary re-fetching)
- [ ] Modal opens/closes smoothly

## Accessibility Testing

- [ ] Tab navigation works with keyboard
- [ ] Focus states are visible
- [ ] Screen reader announces tab changes
- [ ] All interactive elements are keyboard accessible
- [ ] Color contrast meets WCAG standards

## Next Steps

After testing is complete:
1. Document any bugs found
2. Test with real users (teachers and parents)
3. Gather feedback on UI/UX
4. Consider adding features like:
   - Bulk photo selection in teacher view
   - Photo search/filter by date
   - Favorites/bookmarks
   - Share photos via link

## Support

If you encounter issues during testing:
1. Check browser console for errors
2. Check Supabase logs
3. Verify database records are correct
4. Review RLS policies in Supabase

---

**Testing Date**: _____________  
**Tested By**: _____________  
**Version**: 1.0.0
