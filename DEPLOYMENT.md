# Deployment Guide

This guide provides step-by-step instructions for deploying the A&B Daycare Photo Sharing Application to production.

## Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema and RLS policies set up
- [ ] Storage bucket created with policies
- [ ] First admin user created
- [ ] Environment variables documented
- [ ] Application tested locally
- [ ] Build process verified

## Environment Variables

Required environment variables for production:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Deployment to Vercel (Recommended)

### Option 1: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set environment variables**
   - Go to Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

5. **Redeploy to apply environment variables**
   ```bash
   vercel --prod
   ```

### Option 2: Vercel Git Integration

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` directory as root
   - Set framework preset to "Vite"

3. **Configure environment variables**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Vercel Configuration

Create `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Deployment to Netlify

### Option 1: Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

5. **Set environment variables**
   ```bash
   netlify env:set VITE_SUPABASE_URL "your-supabase-url"
   netlify env:set VITE_SUPABASE_ANON_KEY "your-supabase-key"
   ```

### Option 2: Netlify Git Integration

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect to your GitHub repository
   - Set base directory to `frontend`
   - Set build command to `npm run build`
   - Set publish directory to `dist`

3. **Configure environment variables**
   - Go to Site settings > Environment variables
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete

### Netlify Configuration

Create `frontend/netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Deployment to Custom Server

### Using Docker

1. **Create Dockerfile** in `frontend/`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **Create nginx.conf** in `frontend/`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **Build and run**:
```bash
docker build -t abdaycare-app .
docker run -p 80:80 abdaycare-app
```

### Using PM2 (Node.js Process Manager)

1. **Install PM2 globally**
   ```bash
   npm install -g pm2
   ```

2. **Install serve**
   ```bash
   npm install -g serve
   ```

3. **Build the application**
   ```bash
   cd frontend
   npm run build
   ```

4. **Start with PM2**
   ```bash
   pm2 serve dist 3000 --spa --name "abdaycare-app"
   pm2 save
   pm2 startup
   ```

## Post-Deployment Steps

### 1. Verify Deployment

- [ ] Application loads correctly
- [ ] Login functionality works
- [ ] All routes are accessible
- [ ] Images load properly
- [ ] Mobile responsive design works

### 2. Configure Custom Domain (if applicable)

**For Vercel:**
- Go to Settings > Domains
- Add your custom domain
- Follow DNS configuration instructions

**For Netlify:**
- Go to Domain settings
- Add custom domain
- Update DNS records as instructed

### 3. Set Up SSL/HTTPS

Both Vercel and Netlify provide automatic SSL certificates. For custom servers:

```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4. Configure CORS (if needed)

In Supabase Dashboard:
- Go to Settings > API
- Add your production domain to allowed origins

### 5. Monitor Application

Set up monitoring for:
- Application errors
- Performance metrics
- Storage usage
- Database queries

### 6. Set Up Backups

- Enable Supabase daily backups
- Schedule regular database exports
- Back up storage bucket

### 7. Create Admin Documentation

Document for daycare staff:
- Login credentials
- How to upload photos
- How to manage users
- Troubleshooting common issues

## Rollback Procedure

### Vercel

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Netlify

- Go to Netlify dashboard
- Click "Deploys"
- Find previous successful deployment
- Click "Publish deploy"

## Performance Optimization

1. **Enable Caching**
   - Configure CDN caching for static assets
   - Set appropriate cache headers

2. **Image Optimization**
   - Use Supabase Image Transformations
   - Generate thumbnails on upload
   - Lazy load images

3. **Database Optimization**
   - Monitor slow queries
   - Add indexes as needed
   - Use connection pooling

4. **Monitor Bundle Size**
   ```bash
   npm run build -- --analyze
   ```

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] RLS policies tested
- [ ] Authentication working correctly
- [ ] Storage policies configured
- [ ] Rate limiting enabled (if applicable)
- [ ] Regular security updates scheduled

## Maintenance

### Regular Tasks

**Weekly:**
- Check application logs
- Monitor storage usage
- Review error reports

**Monthly:**
- Update dependencies
- Review security advisories
- Database performance review
- User feedback review

**Quarterly:**
- Full security audit
- Performance optimization
- Backup restoration test
- Disaster recovery drill

## Troubleshooting

### Build Fails

**Check:**
- Node version (should be 18+)
- Package.json dependencies
- Environment variables set correctly
- Build logs for specific errors

### Application Not Loading

**Check:**
- Environment variables configured
- Supabase URL and key correct
- CORS settings in Supabase
- Browser console for errors
- Network tab for failed requests

### Images Not Displaying

**Check:**
- Storage bucket is public
- Storage policies configured
- Image URLs are correct
- Network connectivity

### Authentication Issues

**Check:**
- Supabase Auth settings
- Redirect URLs configured
- RLS policies enabled
- User exists in both auth.users and users table

## Support and Contact

For deployment assistance:
- Email: support@abdaycare.com
- Documentation: [Link to internal docs]
- Emergency contact: [Phone number]

---

**Last Updated**: February 8, 2026
