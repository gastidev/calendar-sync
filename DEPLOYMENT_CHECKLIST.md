# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

### Database Setup
- [ ] Create Supabase project
- [ ] Run all migrations in order (001-010)
- [ ] Verify RLS policies are enabled
- [ ] Test database connection locally
- [ ] Backup database (if migrating from existing)

### Google OAuth Setup
- [ ] Create Google Cloud project
- [ ] Enable Google Calendar API
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URIs:
  - [ ] `http://localhost:3003/auth/google/callback` (dev)
  - [ ] `https://your-railway-app.railway.app/auth/google/callback` (prod)
- [ ] Add authorized JavaScript origins:
  - [ ] `http://localhost:3000` (dev)
  - [ ] `https://your-vercel-app.vercel.app` (prod)

### Code Preparation
- [ ] All code committed to repository
- [ ] No sensitive data in code (use env vars)
- [ ] `.env` files in `.gitignore`
- [ ] Build passes locally (`pnpm build` in both backend and frontend)
- [ ] Tests pass (if applicable)

## Railway Deployment (Backend)

### Initial Setup
- [ ] Create Railway account
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend/`

### Environment Variables
- [ ] `PORT=3003` (or let Railway auto-assign)
- [ ] `NODE_ENV=production`
- [ ] `SUPABASE_URL` (from Supabase dashboard)
- [ ] `SUPABASE_ANON_KEY` (from Supabase dashboard)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (from Supabase dashboard - keep secret!)
- [ ] `GOOGLE_CLIENT_ID` (from Google Cloud Console)
- [ ] `GOOGLE_CLIENT_SECRET` (from Google Cloud Console)
- [ ] `GOOGLE_REDIRECT_URI` (Railway domain + `/auth/google/callback`)
- [ ] `FRONTEND_URL` (Vercel domain)
- [ ] `WEBHOOK_BASE_URL` (Railway domain - optional)

### Deployment
- [ ] Trigger initial deployment
- [ ] Verify build succeeds
- [ ] Check deployment logs for errors
- [ ] Get Railway domain from Settings → Networking
- [ ] Test health endpoint: `https://your-domain.railway.app/health`
- [ ] Update `GOOGLE_REDIRECT_URI` with actual Railway domain
- [ ] Redeploy if redirect URI changed

### Post-Deployment
- [ ] Test OAuth callback endpoint
- [ ] Verify CORS allows Vercel domain
- [ ] Check application logs
- [ ] Monitor resource usage

## Vercel Deployment (Frontend)

### Initial Setup
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Set root directory to `frontend/`
- [ ] Framework preset: Next.js (auto-detected)

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` (Railway API domain)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (from Supabase dashboard)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase dashboard)

### Deployment
- [ ] Trigger initial deployment
- [ ] Verify build succeeds
- [ ] Check deployment logs
- [ ] Get Vercel domain
- [ ] Update `FRONTEND_URL` in Railway with Vercel domain
- [ ] Update Google OAuth authorized origins with Vercel domain
- [ ] Redeploy both services if needed

### Post-Deployment
- [ ] Visit Vercel domain
- [ ] Test login/signup flow
- [ ] Verify API connection (check browser console)
- [ ] Test calendar connection
- [ ] Test sync creation
- [ ] Check for console errors

## Integration Testing

### Authentication Flow
- [ ] User can sign up
- [ ] User can log in
- [ ] Session persists across page refreshes
- [ ] User can log out

### Calendar Connection
- [ ] User can connect Google Calendar
- [ ] OAuth redirect works correctly
- [ ] Calendars are listed after connection
- [ ] User can disconnect calendar
- [ ] User can change calendar color

### Sync Functionality
- [ ] User can create sync between calendars
- [ ] Sync settings can be configured
- [ ] Manual sync trigger works
- [ ] Automatic sync runs (check after 10 minutes)
- [ ] Sync logs are recorded
- [ ] User can delete sync

### UI/UX
- [ ] All pages load without errors
- [ ] Responsive design works on mobile
- [ ] Dark mode toggle works
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Toast notifications appear

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] CORS configured correctly (only Vercel domain)
- [ ] RLS policies enabled in Supabase
- [ ] Rate limiting enabled on API
- [ ] HTTPS enabled (automatic on Railway/Vercel)
- [ ] Service role key only in Railway (not frontend)
- [ ] OAuth credentials secured

## Monitoring Setup

### Railway
- [ ] Set up log monitoring
- [ ] Configure alerts for service failures
- [ ] Monitor resource usage
- [ ] Set up uptime monitoring (optional)

### Vercel
- [ ] Enable analytics (optional)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor function execution times
- [ ] Check build logs regularly

## Documentation

- [ ] Update README with production URLs
- [ ] Document any custom configurations
- [ ] Note any environment-specific behaviors
- [ ] Update team on deployment process

## Rollback Plan

- [ ] Know how to rollback Railway deployment
- [ ] Know how to rollback Vercel deployment
- [ ] Have database backup strategy
- [ ] Test rollback procedure

## Post-Launch

- [ ] Monitor for 24-48 hours
- [ ] Check error rates
- [ ] Monitor user feedback
- [ ] Review performance metrics
- [ ] Plan for scaling if needed

---

## Quick Reference

### Railway Commands (CLI)
```bash
railway login
railway link
railway up
railway logs
railway variables
```

### Vercel Commands (CLI)
```bash
vercel login
vercel link
vercel deploy
vercel logs
vercel env ls
```

### Useful URLs
- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- Google Cloud Console: https://console.cloud.google.com

