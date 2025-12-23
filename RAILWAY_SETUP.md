# Railway Setup Guide

This guide provides step-by-step instructions for setting up Railway deployment for the backend API.

## Quick Setup

### Option 1: Using Railway Dashboard (Recommended)

1. **Create New Project**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Select Repository**
   - Choose your `calendar-sync` repository
   - Railway will detect it's a Node.js project

3. **Configure Service**
   - Railway will create a service automatically
   - **Root Directory**: Leave as repository root (default)
   - Railway will automatically detect and use `nixpacks.toml` from the root

4. **Add Environment Variables**
   - Go to your service → Variables tab
   - Add all required environment variables (see below)

5. **Deploy**
   - Railway will automatically start building
   - Watch the build logs to ensure it succeeds
   - Once deployed, get your domain from Settings → Networking

### Option 2: Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to existing project (or create new)
railway link

# Set environment variables
railway variables set PORT=3003
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=your_supabase_url
# ... add all other variables

# Deploy
railway up
```

## Environment Variables

Add these in Railway dashboard → Your Service → Variables:

```env
PORT=3003
NODE_ENV=production
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.railway.app/auth/google/callback
FRONTEND_URL=https://your-vercel-app.vercel.app
WEBHOOK_BASE_URL=https://your-app.railway.app
```

**Important:**
- Replace `your-app.railway.app` with your actual Railway domain (get it after first deployment)
- Replace `your-vercel-app.vercel.app` with your Vercel domain
- Get Supabase credentials from [Supabase Dashboard](https://app.supabase.com)
- Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)

## How It Works

The root-level `nixpacks.toml` file tells Railway how to build and run your application:

1. **Setup Phase**: Installs Node.js 20 and pnpm
2. **Install Phase**: Runs `cd backend && pnpm install --frozen-lockfile`
3. **Build Phase**: Runs `cd backend && pnpm build` (compiles TypeScript)
4. **Start Phase**: Runs `cd backend && pnpm start` (starts the server)

Railway automatically:
- Detects the `nixpacks.toml` file in the root
- Uses it to build your application
- Handles the monorepo structure correctly

## Troubleshooting

### Build Fails: "cd: backend: No such file or directory"

**Solution**: Make sure Railway is using the repository root as the root directory, not `backend/`. The `nixpacks.toml` handles the directory navigation.

### Port Binding Errors

**Solution**: Railway automatically sets the `PORT` environment variable. Make sure your code uses `process.env.PORT` (which it does).

### Environment Variables Not Working

**Solution**: 
- Verify variables are set in Railway dashboard
- Check variable names match exactly (case-sensitive)
- Restart the service after adding new variables

### Build Takes Too Long

**Solution**: 
- Railway caches `node_modules` between builds
- First build will be slower
- Subsequent builds should be faster

## Monitoring

### View Logs
- Railway Dashboard → Your Service → Deployments → Click on deployment → View logs
- Or use CLI: `railway logs`

### Health Check
- Railway automatically checks `/health` endpoint
- Configured in `railway.toml`
- Service will restart if health check fails

### Metrics
- View CPU, Memory, and Network usage in Railway dashboard
- Set up alerts for resource limits

## Custom Domain

1. Go to Settings → Networking
2. Click "Generate Domain" or "Custom Domain"
3. For custom domain, add DNS records as instructed
4. Update `GOOGLE_REDIRECT_URI` and `WEBHOOK_BASE_URL` with new domain

## Rollback

If a deployment fails:
1. Go to Deployments tab
2. Find the last successful deployment
3. Click "Redeploy" on that deployment

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check build logs for specific error messages

