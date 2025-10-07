# 🏋️ A1Lifter - Production Ready!

**Multisport Competition Management Platform**

> ✨ **Status**: Production Ready - Fully Functional with Real-time Updates

## 🎯 Features Implementate

- ✅ **Real-time Updates** con Supabase Realtime
- ✅ **Dashboard** con statistiche reali dal database (zero mock data)
- ✅ **Gestione Atleti** completa (CRUD)
- ✅ **Sistema Iscrizioni** con approvazione automatica
- ✅ **Interfaccia Giudici** per valutazione tentativi live
- ✅ **Risultati Live** con leaderboard in tempo reale
- ✅ **Sistema Notifiche** automatico
- ✅ **Gestione Record** personali e di gara
- ✅ **API RESTful** complete
- ✅ **Upload video tentativi** con storage Supabase
- ✅ **Integrazione livestream** per eventi attivi
- ✅ **Analytics avanzate** con grafici Recharts
- ✅ **Internazionalizzazione** (🇬🇧 English / 🇮🇹 Italiano)
- ✅ **Notifiche email** per tentativi e iscrizioni

## 🚀 Quick Start

```bash
# 1. Installa dipendenze
npm install

# 2. Crea .env.local
cp .env.example .env.local
# Configura DATABASE_URL, SUPABASE_URL, etc.

# 3. Setup database
npm run db:push
npm run db:seed  # opzionale

# 4. Setup RLS policies
npm run setup:rls

# 5. Verifica setup
./scripts/check-production-ready.sh

# 6. Start
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📊 Pagine Disponibili

- `/dashboard` - Dashboard con statistiche real-time
- `/athletes` - Gestione atleti
- `/live` - Risultati in tempo reale
- `/judge` - Interfaccia giudici
- `/events/create` - Creazione eventi

## 🔧 Tecnologie

- Next.js 15 (App Router)
- PostgreSQL (Supabase)
- Prisma ORM
- Supabase Realtime
- React Query
- NextAuth.js
- Tailwind CSS + Radix UI
- Sonner (Toast notifications)

## 📚 Documentazione

- **[PRODUCTION_COMPLETE.md](../PRODUCTION_COMPLETE.md)** - Guida completa
- **[SETUP.md](./SETUP.md)** - Setup dettagliato
- **[.env.example](./.env.example)** - Variabili d'ambiente

### 🔐 Nuove variabili d'ambiente

Per abilitare le nuove integrazioni assicurati di configurare anche:

- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_KEY` – richiesto per l'upload dei video tentativi nel bucket `attempt-videos`
- `SUPABASE_ATTEMPT_VIDEO_BUCKET` – nome bucket opzionale (default `attempt-videos`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` – credenziali SMTP per l'invio delle email transazionali

## 🌐 Deploy

```bash
# Vercel
vercel --prod

# Configura env variables su Vercel dashboard
```

## 🎉 Production Ready!

✅ Tutte le funzionalità implementate  
✅ Zero dati mock  
✅ Real-time updates  
✅ Database reale connesso
