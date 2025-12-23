# Deployment Guide

This guide covers deploying the Calendar Sync application to Railway (API) and Vercel (Frontend).

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- Vercel account ([vercel.com](https://vercel.com))
- Supabase project (for database)
- Google Cloud Console project (for OAuth)

## Backend Deployment (Railway)

### 1. Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo" (recommended) or "Empty Project"

### 2. Connect Repository

If using GitHub:
1. Select your repository
2. Railway will detect the project structure
3. Set the root directory to `backend/`

### 3. Configure Environment Variables

In Railway dashboard, go to your service → Variables tab and add:

```env
PORT=3003
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-railway-app.railway.app/auth/google/callback
FRONTEND_URL=https://your-vercel-app.vercel.app
WEBHOOK_BASE_URL=https://your-railway-app.railway.app
```

**Important Notes:**
- Replace `your-railway-app.railway.app` with your actual Railway domain
- Replace `your-vercel-app.vercel.app` with your actual Vercel domain
- Get Supabase credentials from your Supabase project settings
- Get Google OAuth credentials from Google Cloud Console

### 4. Configure Build Settings

Railway should auto-detect the build settings from `railway.json` and `nixpacks.toml`. If not:

- **Build Command**: `cd backend && pnpm install && pnpm build`
- **Start Command**: `cd backend && pnpm start`
- **Root Directory**: `backend/`

### 5. Deploy

Railway will automatically deploy on:
- Push to main/master branch (if connected to GitHub)
- Manual deploy from dashboard

### 6. Get Railway Domain

After deployment:
1. Go to Settings → Networking
2. Generate a domain or use the default Railway domain
3. Update `GOOGLE_REDIRECT_URI` and `WEBHOOK_BASE_URL` with this domain

## Frontend Deployment (Vercel)

### 1. Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository

### 2. Configure Project Settings

- **Framework Preset**: Next.js
- **Root Directory**: `frontend/`
- **Build Command**: `pnpm build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `pnpm install` (auto-detected)

### 3. Configure Environment Variables

In Vercel dashboard, go to Settings → Environment Variables and add:

```env
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:**
- Replace `your-railway-app.railway.app` with your actual Railway API domain
- These variables are prefixed with `NEXT_PUBLIC_` to expose them to the browser

### 4. Deploy

Vercel will automatically:
- Deploy on push to main branch
- Create preview deployments for pull requests

### 5. Update Google OAuth Redirect URI

After getting your Vercel domain:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-railway-app.railway.app/auth/google/callback`
4. Add authorized JavaScript origins: `https://your-vercel-app.vercel.app`

## Post-Deployment Checklist

### Backend (Railway)
- [ ] Verify API is accessible at Railway domain
- [ ] Check logs for any startup errors
- [ ] Test health endpoint (if available)
- [ ] Verify environment variables are set correctly
- [ ] Test OAuth callback endpoint

### Frontend (Vercel)
- [ ] Verify frontend is accessible at Vercel domain
- [ ] Test login/signup flow
- [ ] Verify API connection (check browser console)
- [ ] Test calendar connection flow
- [ ] Verify environment variables are exposed correctly

### Google OAuth
- [ ] Authorized redirect URI matches Railway callback URL
- [ ] Authorized JavaScript origins include Vercel domain
- [ ] OAuth consent screen is configured

### Supabase
- [ ] All migrations are applied
- [ ] RLS policies are configured correctly
- [ ] Service role key is kept secure (only in Railway)

## Troubleshooting

### Backend Issues

**Port binding errors:**
- Ensure Railway is using the PORT environment variable
- Check that server listens on `0.0.0.0` (already configured)

**Build failures:**
- Check Railway logs for specific errors
- Verify `pnpm-lock.yaml` is committed
- Ensure TypeScript compiles without errors

**Environment variable issues:**
- Verify all required variables are set in Railway
- Check variable names match exactly (case-sensitive)
- Restart service after adding new variables

### Frontend Issues

**API connection errors:**
- Verify `NEXT_PUBLIC_API_URL` points to Railway domain
- Check CORS settings in backend
- Verify Railway service is running

**Build failures:**
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Check for TypeScript errors

**Environment variables not working:**
- Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new variables
- Check browser console for undefined values

## Continuous Deployment

Both Railway and Vercel support automatic deployments:

- **Railway**: Deploys on push to connected branch (usually main/master)
- **Vercel**: Deploys on push to main branch, creates previews for PRs

To disable auto-deploy:
- Railway: Settings → Source → Disable auto-deploy
- Vercel: Project Settings → Git → Disable automatic deployments

## Monitoring

### Railway
- View logs in Railway dashboard
- Set up alerts for service failures
- Monitor resource usage

### Vercel
- View build logs and analytics
- Monitor function execution times
- Set up error tracking (Sentry, etc.)

## Security Notes

1. **Never commit** `.env` files or secrets
2. **Use Railway/Vercel** environment variables for all secrets
3. **Rotate keys** periodically (Supabase, Google OAuth)
4. **Enable RLS** in Supabase for data protection
5. **Use HTTPS** (enabled by default on Railway/Vercel)
6. **Set up CORS** properly in backend (already configured)

## Cost Optimization

### Railway
- Use Railway's free tier for development
- Monitor resource usage
- Scale down when not in use

### Vercel
- Free tier includes generous limits
- Monitor bandwidth usage
- Optimize images and assets

## Support

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

