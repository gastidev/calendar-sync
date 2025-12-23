# Calendar Sync - Setup Guide

Complete setup instructions for the Calendar Sync application.

## Prerequisites

1. **Node.js**: Version 20 or higher
2. **Supabase Account**: Create at [supabase.com](https://supabase.com)
3. **Google Cloud Project**: For Calendar API access

## Step 1: Supabase Setup

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 1.2 Run Database Migrations
1. Go to SQL Editor in Supabase dashboard
2. Run each migration file in order from `supabase/migrations/`:
   - `001_create_calendar_connections.sql`
   - `002_create_google_calendars.sql`
   - `003_create_calendar_syncs.sql`
   - `004_create_sync_settings.sql`
   - `005_create_synced_events.sql`
   - `006_create_sync_logs.sql`
   - `007_create_webhook_subscriptions.sql`

### 1.3 Enable Email Auth
1. Go to Authentication → Providers
2. Enable Email provider
3. (Optional) Disable email confirmation for development

## Step 2: Google Cloud Setup

### 2.1 Create Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing

### 2.2 Enable Calendar API
1. Go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

### 2.3 Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure OAuth consent screen:
   - User Type: External
   - App name: Calendar Sync
   - Scopes: Add Calendar API scopes
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: Calendar Sync Backend
   - Authorized redirect URIs:
     - `http://localhost:3003/auth/google/callback` (development)
     - `https://your-domain.com/auth/google/callback` (production)
5. Download or copy the Client ID and Client Secret

## Step 3: Backend Setup

### 3.1 Install Dependencies
```bash
cd backend
npm install
```

### 3.2 Environment Configuration
Create `backend/.env` from `.env.example`:

```env
PORT=3003
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3003/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Webhook (optional for development, required for production)
WEBHOOK_BASE_URL=https://your-domain.com
```

### 3.3 Start Backend
```bash
npm run dev
```

Backend will run on [http://localhost:3003](http://localhost:3003)

## Step 4: Frontend Setup

### 4.1 Install Dependencies
```bash
cd frontend
npm install
```

### 4.2 Environment Configuration
Create `frontend/.env.local` from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:3003
```

### 4.3 Start Frontend
```bash
npm run dev
```

Frontend will run on [http://localhost:3000](http://localhost:3000)

## Step 5: Testing the Application

### 5.1 Create Account
1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Sign up"
3. Enter email and password
4. Sign in

### 5.2 Connect Calendar
1. Go to "Connected Calendars"
2. Click "Add Calendar"
3. Authenticate with Google
4. Allow calendar access

### 5.3 Create Sync
1. Go to "Calendar Syncs"
2. Click "Create Sync"
3. Select source and target calendars
4. Click "Create Sync"

### 5.4 Configure Sync
1. Click settings icon on sync
2. Enable Privacy Mode (optional)
3. Choose event filter
4. Save changes

### 5.5 Test Sync
1. Click "Sync Now" to manually trigger
2. Or wait 10 minutes for automatic sync
3. Check both calendars for synced events

## Production Deployment

### Backend (Railway/Fly.io/Heroku)

1. **Environment Variables**: Set all variables from `.env.example`
2. **Database**: Update `SUPABASE_URL` to production instance
3. **Google OAuth**: Update redirect URI to production URL
4. **Webhooks**: Set `WEBHOOK_BASE_URL` to production backend URL
5. **Build Command**: `npm run build`
6. **Start Command**: `npm start`

### Frontend (Vercel/Netlify)

1. **Environment Variables**: Set all variables from `.env.example`
2. **API URL**: Update `NEXT_PUBLIC_API_URL` to production backend
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

### Google Cloud Production Setup

1. Update OAuth redirect URIs with production URL
2. Submit app for OAuth verification (if publishing publicly)
3. Add production domains to authorized domains

## Troubleshooting

### Backend won't start
- Check Node.js version (must be >= 20)
- Verify all environment variables are set
- Check Supabase credentials

### OAuth fails
- Verify Google redirect URI matches exactly
- Check Google Client ID and Secret
- Ensure Calendar API is enabled

### Syncs not working
- Check if calendars are connected
- Verify sync is active (not paused)
- Check sync logs for errors
- Ensure Google tokens haven't expired

### Frontend build errors
- Run `npm install` to ensure dependencies are installed
- Clear `.next` directory and rebuild
- Check for TypeScript errors

## Development Tips

### Run both servers concurrently
Create a root `package.json`:

```json
{
  "scripts": {
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "dev": "concurrently \"npm:dev:backend\" \"npm:dev:frontend\""
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

Then run:
```bash
npm run dev
```

### Database Migrations

To create a new migration:
1. Create file in `supabase/migrations/` with naming pattern `00X_description.sql`
2. Run in Supabase SQL Editor
3. Test locally before deploying to production

### Viewing Logs

Backend logs are in console. In production:
- Railway: `railway logs`
- Fly.io: `flyctl logs`
- Heroku: `heroku logs --tail`

## Security Checklist

- [ ] Supabase RLS policies are enabled
- [ ] Service role key is only in backend
- [ ] Anon key is safe to expose in frontend
- [ ] Google OAuth credentials are not committed
- [ ] Environment files are in `.gitignore`
- [ ] HTTPS is enabled in production
- [ ] CORS is configured for production domain

## Support

For issues or questions:
1. Check this guide first
2. Review error messages in logs
3. Check Supabase and Google Cloud dashboards
4. Verify all environment variables

## Next Steps

- Set up monitoring (Sentry, LogRocket)
- Configure email notifications
- Add webhook support for real-time sync
- Implement sync conflict resolution UI
- Add support for more calendar providers
