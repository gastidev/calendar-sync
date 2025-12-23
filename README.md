# Calendar Sync Application

A calendar synchronization application that allows users to connect their Google Calendars and create bidirectional sync relationships with privacy mode support.

## Architecture

- **Backend**: Fastify + TypeScript
- **Frontend**: Next.js 15 + React 19 + shadcn/ui
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Calendar Integration**: Google Calendar API

## Features

- 🔐 Secure authentication via Supabase
- 📅 Connect multiple Google Calendar accounts
- 🔄 Bidirectional calendar syncing (1:1 relationships)
- 🔒 Privacy mode with customizable placeholder text
- 🎯 Event filtering (all events vs accepted only)
- ⏰ Automatic sync every 10 minutes via cron job
- 📊 Sync history and logs
- 🌙 Dark mode support

## Project Structure

```
calendar-sync/
├── backend/                  # Fastify API
│   ├── src/
│   │   ├── config/          # Environment, database, OAuth config
│   │   ├── plugins/         # Auth & rate limiting
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Database access
│   │   ├── types/           # TypeScript types
│   │   ├── app.ts          # Fastify app setup
│   │   └── server.ts        # Server entry point
│   └── package.json
│
├── frontend/                 # Next.js app
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities & API client
│   └── package.json
│
└── supabase/
    └── migrations/          # Database schema

## Setup Instructions

### Prerequisites

- Node.js >= 20
- Supabase account
- Google Cloud project with Calendar API enabled

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in:
   ```env
   PORT=3003
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3003/auth/google/callback
   FRONTEND_URL=http://localhost:3000
   ```

4. Run migrations in Supabase:
   - Apply all migration files from `supabase/migrations/` in order

5. Start the backend:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:3003
   ```

4. Start the frontend:
   ```bash
   npm run dev
   ```

## Database Schema

### Core Tables

1. **calendar_connections** - OAuth connections to Google accounts
2. **google_calendars** - Individual calendars from connected accounts
3. **calendar_syncs** - Sync relationships between calendars
4. **sync_settings** - Privacy mode & event filter settings
5. **synced_events** - Event mappings to prevent sync loops
6. **sync_logs** - Sync execution history
7. **webhook_subscriptions** - Google Calendar webhook tracking

## API Endpoints

### Authentication
- `GET /auth/google/init` - Initiate OAuth flow
- `GET /auth/google/callback` - OAuth callback

### Calendar Connections
- `GET /api/v1/connections` - List all connections
- `GET /api/v1/connections/:id/calendars` - Get calendars for connection
- `DELETE /api/v1/connections/:id` - Disconnect account

### Calendar Syncs
- `GET /api/v1/syncs` - List all syncs
- `POST /api/v1/syncs` - Create new sync
- `PATCH /api/v1/syncs/:id` - Update sync (pause/resume)
- `DELETE /api/v1/syncs/:id` - Delete sync
- `GET /api/v1/syncs/:id/settings` - Get sync settings
- `PATCH /api/v1/syncs/:id/settings` - Update settings
- `POST /api/v1/syncs/:id/trigger` - Manually trigger sync
- `GET /api/v1/syncs/:id/logs` - Get sync history

### Webhooks & Cron
- `POST /webhooks/google` - Google Calendar webhook receiver

## How It Works

### Sync Algorithm

1. **Fetch Events**: Retrieve events from both source and target calendars
2. **Apply Filters**: Filter events based on user settings (all vs accepted only)
3. **Detect Changes**: Compare with stored event mappings
4. **Transform Events**: Apply privacy mode if enabled
5. **Sync Direction 1**: Source → Target
   - Create new events in target
   - Update existing events
6. **Sync Direction 2**: Target → Source (bidirectional)
7. **Store Mappings**: Save event relationships to prevent loops
8. **Log Results**: Record sync statistics

### Privacy Mode

When enabled:
- Event titles replaced with placeholder text (default: "Busy")
- Descriptions, locations, and attendees removed
- Time blocks remain visible

### Event Deduplication

- Uses `synced_events` table to track event relationships
- Prevents sync loops by checking if target event originated from another sync
- Compares event updated timestamps to detect changes

## Next Steps

### To Complete the Frontend

1. Create theme provider and dark mode toggle
2. Build dashboard layout with navigation
3. Create Connected Calendars page
4. Create Calendar Syncs page
5. Create Sync Settings modal
6. Add custom hooks for data fetching
7. Build reusable UI components

### Future Enhancements

- Support for Microsoft Outlook/365 calendars
- Sync groups (many-to-many syncing)
- Advanced event filtering rules
- Webhook-based real-time sync
- Email notifications for sync failures
- Calendar color coding
- Recurring event support improvements

## Tech Stack

### Backend
- Fastify 5.x
- TypeScript 5.x
- Google APIs (googleapis)
- Supabase Client
- node-cron
- Zod (validation)
- Pino (logging)

### Frontend
- Next.js 15.x
- React 19.x
- TypeScript 5.x
- Tailwind CSS 4.x
- shadcn/ui
- next-themes
- Supabase SSR
- React Hook Form + Zod

## License

MIT
