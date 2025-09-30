# 🚀 A1Lifter Setup Guide

Complete guide to set up A1Lifter locally and get it running in minutes.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm
- A Supabase account (free tier works)

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `a1lifter`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create new project" and wait ~2 minutes

## Step 2: Get Database Credentials

1. In your Supabase project, go to **Settings** > **Database**
2. Scroll down to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

## Step 3: Get API Keys

1. Go to **Settings** > **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 4: Configure Environment

1. In the project root (`a1lifter-nextjs/`), copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in your credentials:
   ```bash
   # Database
   DATABASE_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@...supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@...supabase.com:5432/postgres"
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="https://[your-project-ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   
   # NextAuth (generate with: openssl rand -base64 32)
   NEXTAUTH_SECRET="your-secret-at-least-32-chars"
   NEXTAUTH_URL="http://localhost:3000"
   ```

## Step 5: Install Dependencies

```bash
cd a1lifter-nextjs
npm install
```

## Step 6: Initialize Database

Push the schema to your Supabase database:

```bash
npm run db:push
```

This creates all tables, enums, and indexes.

## Step 7: Seed Database

Create sample data including admin user:

```bash
npm run db:seed
```

This creates:
- ✅ Admin user: `admin@a1lifter.com` / `Admin123!`
- ✅ Organizer user: `organizer@a1lifter.com` / `Admin123!`
- ✅ 3 Judge users
- ✅ 4 Athlete users
- ✅ 2 Sample events with categories
- ✅ Sample registrations and attempts

## Step 8: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🔑 Login Credentials

### Admin Account
- **Email**: `admin@a1lifter.com`
- **Password**: `Admin123!`

### Test Accounts
- **Organizer**: `organizer@a1lifter.com` / `Admin123!`
- **Judge**: `judge1@a1lifter.com` / `Admin123!`
- **Athlete**: `athlete1@a1lifter.com` / `Admin123!`

## 📋 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio (GUI)
npm run db:reset         # Reset database (CAUTION!)

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # Check TypeScript
npm run format           # Format code with Prettier

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run e2e              # Run E2E tests
```

## 🔍 Verify Setup

### Check Database
```bash
npm run db:studio
```
Opens Prisma Studio at `http://localhost:5555` - you should see all tables populated.

### Check Supabase
1. Go to Supabase Dashboard > **Table Editor**
2. You should see all tables: `users`, `events`, `registrations`, etc.

### Check Application
1. Open `http://localhost:3000`
2. Click "Sign In"
3. Use admin credentials
4. You should see the dashboard

## 🐛 Troubleshooting

### "Environment variable not found: DATABASE_URL"
- Make sure `.env.local` exists in `a1lifter-nextjs/` folder
- Check that all required variables are set

### "FATAL: Tenant or user not found"
- Check your DATABASE_URL has the correct password
- Make sure the Supabase project is active

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

### Prisma Client errors
- Run `npx prisma generate`
- Restart your dev server

### Port 3000 already in use
- Kill the process: `lsof -ti:3000 | xargs kill`
- Or use a different port: `PORT=3001 npm run dev`

## 📚 Next Steps

1. **Configure OAuth** (optional): Add Google/GitHub login
2. **Set up Email**: Configure SMTP for notifications
3. **Customize**: Update branding and colors
4. **Deploy**: See `PRODUCTION_DEPLOYMENT.md`

## 🆘 Need Help?

- Check the [README.md](./README.md) for project overview
- See [PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md) for deployment
- Review [SUPABASE_MIGRATION.md](../SUPABASE_MIGRATION.md) for database details

## 🎯 What's Next?

Your A1Lifter instance is now running! You can:

1. Create new events as an organizer
2. Register athletes for competitions
3. Assign judges to events
4. Run live judging sessions
5. View real-time leaderboards
6. Export results and generate reports

Happy lifting! 💪
