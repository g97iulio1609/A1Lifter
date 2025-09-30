# 🚀 A1Lifter - Quick Reference Guide

## 📋 Essential Commands

### Setup Iniziale
```bash
# 1. Clona repository
git clone https://github.com/g97iulio1609/A1Lifter.git
cd A1Lifter/a1lifter-nextjs

# 2. Installa dipendenze
npm install

# 3. Configura environment
cp .env.example .env.local
# Modifica .env.local con le tue credenziali

# 4. Setup database
npm run db:push

# 5. (Opzionale) Seed dati di test
npm run db:seed

# 6. Setup RLS policies su Supabase
npm run setup:rls

# 7. Verifica setup
./scripts/check-production-ready.sh

# 8. Start development
npm run dev
```

### Development
```bash
# Start dev server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Create migration
npm run db:migrate

# Deploy migrations
npm run db:migrate:deploy

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed

# Reset database (careful!)
npm run db:reset

# Full setup (push + seed)
npm run db:setup
```

### Testing
```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run e2e

# Run E2E with UI
npm run e2e:ui

# Run all tests
npm run test:all
```

### Build & Deploy
```bash
# Build for production
npm run build

# Start production server
npm run start

# Deploy to Vercel
vercel --prod
```

---

## 🔑 Environment Variables

### Required
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### Optional
```env
# Real-time
NEXT_PUBLIC_ENABLE_REALTIME="true"

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Feature Flags
NEXT_PUBLIC_ENABLE_REGISTRATIONS="true"
NEXT_PUBLIC_ENABLE_LIVE_JUDGING="true"
NEXT_PUBLIC_ENABLE_NOTIFICATIONS="true"
```

---

## 🌐 URLs

### Development
- App: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Athletes: http://localhost:3000/athletes
- Live Results: http://localhost:3000/live
- Judge Interface: http://localhost:3000/judge
- Create Event: http://localhost:3000/events/create

### API Endpoints (localhost:3000)
- GET /api/dashboard/stats
- GET /api/athletes
- POST /api/registrations
- PATCH /api/attempts/[id]/judge
- GET /api/events/[id]/leaderboard

---

## 🎯 Quick Actions

### Creare un nuovo atleta
```typescript
import { useCreateAthlete } from "@/hooks/api/use-athletes"

const createAthlete = useCreateAthlete()

await createAthlete.mutateAsync({
  email: "athlete@example.com",
  name: "John Doe",
  password: "secure-password"
})
```

### Iscriversi a un evento
```typescript
import { useCreateRegistration } from "@/hooks/api/use-registrations"

const createRegistration = useCreateRegistration()

await createRegistration.mutateAsync({
  eventId: "event-id",
  categoryId: "category-id",
  bodyWeight: 75.5
})
```

### Giudicare un tentativo
```typescript
import { useJudgeAttempt } from "@/hooks/api/use-attempts"

const judgeAttempt = useJudgeAttempt()

await judgeAttempt.mutateAsync({
  attemptId: "attempt-id",
  judgeData: {
    result: "GOOD"
  }
})
```

### Abilitare real-time updates
```typescript
import { useRealtimeDashboard } from "@/hooks/api/use-realtime"

// In un component
useRealtimeDashboard()  // Auto-refresh su ogni cambio
```

---

## 🔧 Troubleshooting

### Real-time non funziona
```bash
# 1. Verifica variabile d'ambiente
echo $NEXT_PUBLIC_ENABLE_REALTIME

# 2. Controlla Supabase replication
# Vai su Supabase > Database > Replication
# Assicurati che sia abilitato per: events, attempts, registrations

# 3. Restart dev server
npm run dev
```

### Database errors
```bash
# Reset completo database
npm run db:reset

# Re-push schema
npm run db:push

# Re-seed
npm run db:seed
```

### TypeScript errors
```bash
# Rigenera Prisma client
npm run db:generate

# Check errori
npm run type-check

# Fix linting
npm run lint:fix
```

### Build fails
```bash
# Pulisci cache
rm -rf .next node_modules
npm install
npm run build
```

---

## 📊 Supabase Setup

### Enable Replication
1. Vai su Supabase Dashboard
2. Database > Replication
3. Abilita per tabelle:
   - ✅ events
   - ✅ attempts
   - ✅ registrations
   - ✅ records
   - ✅ notifications

### RLS Policies
```bash
# Applica policies
npm run setup:rls

# O manualmente
psql $DATABASE_URL < scripts/setup-rls-policies.sql
```

---

## 🎨 UI Components Usage

### Toast Notifications
```typescript
import { toast } from "sonner"

// Success
toast.success("Operation successful!")

// Error
toast.error("Something went wrong", {
  description: "Please try again later"
})

// Loading
const toastId = toast.loading("Processing...")
// Later
toast.success("Done!", { id: toastId })
```

### Loading States
```typescript
const { data, isLoading } = useAthletes()

if (isLoading) {
  return <div className="animate-pulse">Loading...</div>
}

return <div>{/* content */}</div>
```

---

## 📚 Documentation Links

- [Main README](./README.md)
- [Production Guide](../PRODUCTION_COMPLETE.md)
- [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)
- [Changelog](../CHANGELOG.md)
- [Setup Guide](./SETUP.md)

---

## 🆘 Support

### Common Issues
1. **Can't connect to database**: Verifica `DATABASE_URL` in `.env.local`
2. **Real-time not working**: Controlla replication su Supabase
3. **TypeScript errors**: Rigenera Prisma client con `npm run db:generate`
4. **Build fails**: Pulisci cache e reinstalla: `rm -rf .next && npm install`

### Debug Mode
```bash
# Start with debug
DEBUG=* npm run dev

# Check logs
tail -f .next/build-manifest.json
```

---

## ✅ Pre-Deploy Checklist

```bash
# 1. Verifica setup
./scripts/check-production-ready.sh

# 2. Type check
npm run type-check

# 3. Linting
npm run lint

# 4. Build test
npm run build

# 5. Test E2E (opzionale)
npm run e2e

# 6. Verifica environment variables
cat .env.local

# 7. Ready to deploy!
vercel --prod
```

---

**🚀 Ready to Rock!**

Usa questo documento come reference rapida per le operazioni quotidiane.
