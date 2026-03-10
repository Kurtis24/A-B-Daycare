# A&B Daycare Photo Sharing Application 

A mobile-first web application for daycare centers to facilitate secure photo sharing between teachers and parents.

## Features

### For Parents
- View photos of their child only
- Download individual or multiple photos
- Mobile-optimized gallery interface
- Secure authentication

### For Teachers
- Upload photos with batch processing
- Tag multiple children per photo
- View and manage photos from assigned age groups
- Delete their own uploaded photos

### For Super Teachers (3 designated)
- Access all age groups
- Upload photos to any age group
- Full photo management capabilities

### For Administrators
- Complete user management (create parents, teachers, children)
- Assign children to parent accounts
- Manage teacher permissions and age group assignments
- System statistics and monitoring
- Full access to all photos

## Technology Stack

### Frontend
- **React.js** with Vite for fast development
- **Tailwind CSS** for mobile-first responsive design
- **React Router** for navigation
- **Supabase JS Client** for backend integration

### Backend
- **Supabase** (PostgreSQL database)
- **Supabase Auth** for authentication
- **Supabase Storage** for photo hosting
- **Row Level Security (RLS)** for data protection

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Modern web browser

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd A-B-Daycare
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Follow the `DATABASE_SCHEMA.md` file to set up your database:
   - Create all tables
   - Enable Row Level Security
   - Create RLS policies
   - Set up storage bucket
   - Create indexes

### 3. Configure Environment Variables

```bash
cd frontend
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Create First Admin User

In Supabase SQL Editor:

```sql
-- First create the auth user in Supabase Auth UI
-- Then insert the user record:
INSERT INTO users (id, email, name, role)
VALUES ('auth-user-uuid', 'admin@abdaycare.com', 'Admin Name', 'admin');
```

### 6. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 7. Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod
```

3. Set environment variables in Netlify dashboard.

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.jsx       # Main layout wrapper
│   │   └── ProtectedRoute.jsx  # Route protection
│   ├── contexts/            # React contexts
│   │   └── AuthContext.jsx  # Authentication state
│   ├── constants/           # App constants
│   │   └── roles.js         # User roles and age groups
│   ├── lib/                 # Libraries and utilities
│   │   └── supabase.js      # Supabase client
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── ChildrenManagement.jsx
│   │   ├── parent/          # Parent pages
│   │   │   └── ParentGallery.jsx
│   │   ├── teacher/         # Teacher pages
│   │   │   ├── TeacherGallery.jsx
│   │   │   └── PhotoUpload.jsx
│   │   ├── Dashboard.jsx    # Role-based redirector
│   │   ├── Login.jsx
│   │   ├── ForgotPassword.jsx
│   │   └── Unauthorized.jsx
│   ├── App.jsx              # Main app with routes
│   ├── main.jsx             # App entry point
│   └── index.css            # Global styles
├── .env                     # Environment variables
├── .env.example             # Environment template
├── package.json
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
└── vite.config.js           # Vite configuration
```

## User Roles

### Admin
- Create and manage all user accounts
- Assign children to parents
- Assign teacher permissions
- Full system access

### Super Teacher
- Upload photos to any age group
- Access all photos across age groups
- Tag multiple children
- Delete their uploaded photos

### Regular Teacher
- Upload photos to assigned age group(s)
- View photos from assigned age group(s)
- Tag children in their age groups
- Delete their own photos

### Parent
- View photos of their child only
- Download photos
- Cannot upload or delete photos

## Age Groups

- **Infants**: 0-1 years
- **Toddlers**: 2-3 years
- **Preschool**: 4-5 years

## Security Features

- Email-based authentication with Supabase Auth
- Row Level Security (RLS) at database level
- Role-based access control
- Encrypted data transmission (HTTPS)
- Secure file storage with access controls
- Session management with auto-logout
- Password reset functionality

## Photo Management

### Upload Process
1. Teacher selects multiple photos
2. Tags children appearing in each photo
3. System creates records for each child
4. Photos stored with 2-year retention

### Download Process
- Individual photo download
- Bulk download (multiple photos as ZIP)
- Original quality maintained

### Retention Policy
- Photos stored for 2 years from upload
- Automated deletion after retention period
- Admin notification 30 days before deletion
- Export option before deletion

## Mobile Optimization

- Mobile-first responsive design
- Primary viewport: 375px - 428px (iPhone SE to iPhone Pro Max)
- Touch-optimized interface (minimum 44x44px targets)
- Progressive image loading
- Optimized for 4G networks
- Pull-to-refresh support

## Support and Maintenance

### Regular Tasks
- Monitor storage usage
- Review user accounts
- Check system performance
- Update dependencies
- Security patches

### Backup Strategy
- Enable Supabase automatic backups
- Regular database exports
- Storage bucket backups

## Troubleshooting

### Cannot log in
- Verify Supabase credentials in `.env`
- Check if user exists in both auth.users and users table
- Verify RLS policies are correctly set up

### Photos not displaying
- Check Supabase Storage bucket is public
- Verify storage policies are configured
- Check browser console for errors

### Upload fails
- Verify file size (max 10MB per photo)
- Check file format (JPEG, PNG, HEIC)
- Verify teacher has correct role
- Check storage bucket permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Proprietary - A&B Daycare

## Support

For technical support, contact: support@abdaycare.com

---

**Version**: 1.0.0  
**Last Updated**: February 8, 2026  
**Developed for**: A&B Daycare Center
