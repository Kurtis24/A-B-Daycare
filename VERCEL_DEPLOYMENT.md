# Vercel Deployment Guide - A&B Daycare

Complete step-by-step guide to deploy your A&B Daycare app to Vercel.

## Vercel Configuration

### Build Settings

**✅ Already configured in `vercel.json`:**

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `frontend`

## Deployment Options

### Option 1: Deploy via Vercel Website (Recommended - Easiest)

#### Step 1: Prepare Your Repository

```bash
# Make sure you're in the root directory
cd "/Users/kurtis/A&B backend/A-B-Daycare"

# Initialize git if not done
git init
git add .
git commit -m "Initial commit - A&B Daycare Photo Sharing App"

# Push to GitHub
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

#### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repository
5. Configure Project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` ⚠️ IMPORTANT!
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Step 3: Add Environment Variables

In the Vercel project settings, add these environment variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://gaxcmcoqkoaewwvgcbls.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your full key) |

**How to add:**
- Click **Settings** tab
- Click **Environment Variables**
- Add each variable
- Make sure to select **Production**, **Preview**, and **Development**

#### Step 4: Deploy

Click **"Deploy"** button and wait for build to complete (~2-3 minutes)

---

### Option 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

#### Step 3: Deploy from Frontend Directory

```bash
# Navigate to frontend directory
cd "/Users/kurtis/A&B backend/A-B-Daycare/frontend"

# Deploy to production
vercel --prod
```

#### Step 4: Configure During Deployment

The CLI will ask you questions:

```
? Set up and deploy? [Y/n] Y
? Which scope? (Your Vercel account)
? Link to existing project? [y/N] N
? What's your project's name? ab-daycare
? In which directory is your code located? ./
? Want to override the settings? [y/N] y
? Build Command: npm run build
? Output Directory: dist
? Development Command: npm run dev
```

#### Step 5: Set Environment Variables

```bash
vercel env add VITE_SUPABASE_URL
# Paste: https://gaxcmcoqkoaewwvgcbls.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Paste: your anon key from .env file
```

Then redeploy:

```bash
vercel --prod
```

---

## Post-Deployment Steps

### 1. Update Supabase Authentication Settings

In your Supabase project:

1. Go to **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Site URL**:
   ```
   https://your-app-name.vercel.app
   ```
3. Add to **Redirect URLs**:
   ```
   https://your-app-name.vercel.app/**
   https://your-app-name.vercel.app/reset-password
   ```

### 2. Test Your Deployment

1. Visit your Vercel URL (shown after deployment)
2. Test login functionality
3. Test photo upload
4. Test all user roles

### 3. Set Up Custom Domain (Optional)

In Vercel Dashboard:
1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `photos.abdaycare.com`)
4. Follow DNS configuration instructions
5. Vercel will automatically provision SSL certificate

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
```bash
# Make sure all dependencies are in dependencies, not devDependencies
cd frontend
npm install --save-prod @supabase/supabase-js react-router-dom
```

**Error: "Command not found"**
- Verify `package.json` has correct build script
- Should be: `"build": "vite build"`

### Environment Variables Not Working

1. Check spelling exactly matches: `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
2. Variables must start with `VITE_` to be accessible
3. Redeploy after adding/changing env vars

### Login Not Working in Production

1. Verify Supabase redirect URLs include your Vercel domain
2. Check browser console for CORS errors
3. Verify environment variables are set correctly

### Images Not Loading

1. Check Storage bucket is public
2. Verify storage policies are configured
3. Check Supabase CORS settings

---

## Quick Deployment Checklist

Before deploying:
- [ ] All code committed to Git
- [ ] Database tables created in Supabase
- [ ] Storage bucket `photos` created and public
- [ ] RLS policies fixed (ran `complete-rls-fix.sql`)
- [ ] Admin user created and can log in locally
- [ ] `.env` file has correct Supabase credentials
- [ ] Tested app locally at localhost

For Vercel:
- [ ] Vercel account created
- [ ] Repository connected or CLI installed
- [ ] Root directory set to `frontend`
- [ ] Environment variables added in Vercel
- [ ] Supabase redirect URLs updated
- [ ] First deployment successful
- [ ] Tested login on production URL
- [ ] All features work in production

---

## Continuous Deployment

Once set up with GitHub:
- Every push to `main` branch automatically deploys
- Preview deployments for pull requests
- Instant rollbacks from Vercel dashboard

---

## Build Commands Summary

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

## Environment Variables for Vercel

```bash
VITE_SUPABASE_URL=https://gaxcmcoqkoaewwvgcbls.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheGNtY29xa29hZXd3dmdjYmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTgzMTcsImV4cCI6MjA4NjEzNDMxN30.-kSwOoFZbMAfqmDb-Arf55zKBEr-IvDs4wZWu7BJNkM
```

---

## Support

If deployment fails:
- Check Vercel build logs for specific errors
- Verify environment variables are set
- Test build locally: `npm run build`
- Check Vercel Status page for outages

---

**Ready to deploy!** Follow Option 1 (Website) or Option 2 (CLI) above.

**Questions?** Let me know which deployment method you prefer!
