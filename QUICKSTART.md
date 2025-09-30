# 🚀 A1Lifter - Quick Start Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - Name: `a1lifter`
   - Password: **Save this password!**
   - Region: Choose closest
4. Wait ~2 minutes for project creation

## Step 2: Get Credentials

### Database Connection
1. Go to **Settings** > **Database**
2. Find **Connection string** > **URI**
3. Copy both:
   - Transaction pooler (port 6543) - add `?pgbouncer=true`
   - Session pooler (port 5432)

### API Keys
1. Go to **Settings** > **API**
2. Copy:
   - **URL**: `https://xxxxx.supabase.co`
   - **anon public** key
   - **service_role** key

## Step 3: Configure `.env.local`

```bash
cd a1lifter-nextjs
cp .env.example .env.local
```

Edit `.env.local` and paste your credentials:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-...:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Generate this: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Step 4: Install & Setup

```bash
# Install dependencies
npm install

# Push schema to database
npm run db:push

# Seed database with sample data + admin user
npm run db:seed
```

## Step 5: Start Application

```bash
npm run dev
```

Open http://localhost:3000

## Step 6: Login

Use the admin credentials:
- **Email**: `admin@a1lifter.com`
- **Password**: `Admin123!`

---

## 🎉 You're Ready!

Your A1Lifter instance is running with:
- ✅ Admin user created
- ✅ Sample events and competitions
- ✅ Test athletes and judges
- ✅ Sample registrations and attempts
- ✅ Notifications system

## 🔑 All Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@a1lifter.com | Admin123! |
| Organizer | organizer@a1lifter.com | Admin123! |
| Judge | judge1@a1lifter.com | Admin123! |
| Athlete | athlete1@a1lifter.com | Admin123! |

## 🛠️ Common Commands

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run db:studio        # Open database GUI
npm run lint             # Check code quality
npm run test             # Run tests
```

## 📚 Next Steps

1. Explore the dashboard
2. Create a new event
3. Register athletes
4. Assign judges
5. Run live judging
6. View results

For production deployment, see [PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md)

## 🆘 Troubleshooting

### "Tenant or user not found"
- Check your DATABASE_URL password is correct
- Verify the project reference matches

### "Environment variable not found"
- Ensure `.env.local` exists in `a1lifter-nextjs/` folder
- Check all variables are set

### Port 3000 in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill
```

### Prisma Client errors
```bash
npx prisma generate
npm run dev
```

---

**Need help?** Check [SETUP.md](./a1lifter-nextjs/SETUP.md) for detailed guide
