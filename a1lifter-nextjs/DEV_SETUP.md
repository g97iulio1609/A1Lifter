# Development Environment Setup

## Quick Start

A1Lifter now includes an automated development environment setup script that starts all required services with a single command.

### Start Development Environment

```bash
npm run dev
```

This command will automatically:
1. ✅ Check if Supabase is running (start it if needed)
2. ✅ Check if Redis is available (optional, uses in-memory cache if not)
3. ✅ Apply any pending database migrations
4. ✅ Start the Next.js development server

### Stop Development Environment

```bash
npm run dev:stop
```

This stops all development services including Supabase.

## Prerequisites

### Required

- **Node.js** 18+ and npm
- **Supabase CLI**
  ```bash
  brew install supabase/tap/supabase
  ```

### Optional

- **Redis** (for distributed caching, otherwise uses in-memory cache)
  ```bash
  brew install redis
  # Start: redis-server
  # Stop: redis-cli shutdown
  ```

## Available Commands

### Development
- `npm run dev` - Start complete dev environment (Supabase + migrations + Next.js)
- `npm run dev:next-only` - Start only Next.js (if Supabase already running)
- `npm run dev:stop` - Stop all development services

### Database
- `npm run db:migrate` - Create and apply new migration (dev)
- `npm run db:migrate:deploy` - Apply migrations (production-like)
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with test data
- `npm run db:reset` - Reset database (⚠️ deletes all data)
- `npm run db:setup` - Push schema and seed

### Testing
- `npm run test` - Run unit tests (watch mode)
- `npm run test:run` - Run unit tests once
- `npm run test:coverage` - Run tests with coverage
- `npm run e2e` - Run E2E tests
- `npm run test:all` - Run all tests

### Build & Deploy
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter
- `npm run type-check` - Check TypeScript types

## Manual Service Management

If you prefer to manage services manually:

### Start Supabase
```bash
supabase start
```

### Start Redis (optional)
```bash
redis-server
```

### Start Next.js only
```bash
npm run dev:next-only
```

### Stop Supabase
```bash
supabase stop
```

## Environment Variables

The app requires these environment variables in `.env.local`:

```bash
# Database (auto-configured by supabase start)
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Supabase (auto-configured by supabase start)
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"

# NextAuth
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXTAUTH_URL="http://localhost:3000"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Email (optional - for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"
EMAIL_FROM="noreply@a1lifter.com"
```

## Troubleshooting

### Port already in use
If you see "port already in use" errors:

```bash
# Check what's using the port
lsof -i :3000  # Next.js
lsof -i :54321 # Supabase API
lsof -i :54322 # PostgreSQL

# Kill the process
kill -9 <PID>
```

### Supabase won't start
```bash
# Reset Supabase
supabase stop
supabase start
```

### Database migration issues
```bash
# Check migration status
npx prisma migrate status

# Reset and reapply (⚠️ deletes all data)
npm run db:reset
```

### Redis connection errors
Redis is optional. If you don't have Redis running, the app will automatically fall back to in-memory caching.

## Development Workflow

1. **First time setup**:
   ```bash
   git clone <repo>
   cd a1lifter-nextjs
   npm install
   cp .env.example .env.local
   # Edit .env.local with your credentials
   npm run dev
   ```

2. **Daily development**:
   ```bash
   npm run dev  # Starts everything
   # Make your changes
   # Tests run automatically if using vitest --watch
   npm run dev:stop  # Stop when done
   ```

3. **Database changes**:
   ```bash
   # Edit prisma/schema.prisma
   npm run db:migrate  # Creates and applies migration
   # Or for quick prototyping:
   npm run db:push  # Pushes schema without migration
   ```

4. **Before committing**:
   ```bash
   npm run lint:fix
   npm run type-check
   npm run test:run
   npm run build  # Ensure production build works
   ```

## Performance Testing

To run load tests:

```bash
npm run perf:load
```

This uses autocannon to test API endpoints under load.

## Production Notes

In production:
- Supabase CLI is not needed (use hosted Supabase or managed PostgreSQL)
- Redis is recommended for multi-instance deployments
- Use `npm run build && npm start` instead of `npm run dev`
- All environment variables must be configured in your hosting platform
