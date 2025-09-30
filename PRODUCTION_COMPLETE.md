# A1Lifter - Production Ready Deployment Guide

## 🎯 Overview

L'applicazione A1Lifter è ora **production-ready** con le seguenti caratteristiche:

### ✅ Funzionalità Implementate

1. **Real-time Updates con Supabase Realtime**
   - Aggiornamenti live per eventi, tentativi, iscrizioni e record
   - Hooks personalizzati per gestire le subscriptions
   - Auto-refresh delle query quando i dati cambiano

2. **API Complete e RESTful**
   - `/api/athletes` - Gestione completa atleti (CRUD)
   - `/api/registrations` - Iscrizioni eventi con approvazione automatica
   - `/api/attempts` - Tentativi e giudizio
   - `/api/dashboard/stats` - Statistiche reali dal database
   - `/api/notifications` - Sistema notifiche
   - `/api/records` - Gestione record

3. **Dashboard con Dati Reali**
   - Statistiche calcolate dal database
   - Nessun dato mock
   - Aggiornamenti in tempo reale
   - Loading states e skeleton loaders

4. **Pagine Funzionanti**
   - `/dashboard` - Dashboard principale con statistiche reali
   - `/athletes` - Gestione atleti
   - `/live` - Risultati in tempo reale con leaderboard
   - `/judge` - Interfaccia giudici per valutare tentativi
   - `/events/create` - Creazione eventi

5. **Sistema Notifiche**
   - Notifiche automatiche per:
     - Approvazione/rifiuto iscrizioni
     - Risultati tentativi
     - Record personali e di gara
   - Toast notifications con Sonner
   - Counter notifiche non lette

6. **Gestione Errori e UX**
   - Toast notifications per feedback utente
   - Loading states appropriati
   - Gestione permessi basata su ruoli
   - Redirect automatici

## 📋 Setup Instructions

### 1. Prerequisiti

```bash
# Node.js 18+ e npm
node --version
npm --version

# PostgreSQL (via Supabase)
# Account Supabase attivo
```

### 2. Variabili d'Ambiente

Crea un file `.env.local` nella root del progetto:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# NextAuth
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# Feature Flags
NEXT_PUBLIC_ENABLE_REALTIME="true"
```

### 3. Installazione

```bash
cd a1lifter-nextjs

# Installa dipendenze
npm install

# Setup database
npm run db:push

# Seed dati di test (opzionale)
npm run db:seed

# Setup RLS Policies su Supabase
npm run setup:rls
```

### 4. Configurazione Supabase Realtime

Nel pannello Supabase:

1. **Database > Replication**
   - Abilita replication per le tabelle:
     - `events`
     - `attempts`
     - `registrations`
     - `records`
     - `notifications`

2. **Database > Extensions**
   - Assicurati che `pg_stat_statements` sia abilitato

### 5. Avvio Applicazione

```bash
# Development
npm run dev

# Production build
npm run build
npm run start
```

## 🔧 Hooks Realtime Disponibili

```typescript
// Dashboard real-time updates
import { useRealtimeDashboard } from "@/hooks/api/use-realtime"
useRealtimeDashboard()

// Eventi specifici
import { useRealtimeEvents } from "@/hooks/api/use-realtime"
useRealtimeEvents()

// Tentativi di un evento
import { useRealtimeAttempts } from "@/hooks/api/use-realtime"
useRealtimeAttempts(eventId)

// Iscrizioni
import { useRealtimeRegistrations } from "@/hooks/api/use-realtime"
useRealtimeRegistrations(eventId)

// Notifiche utente
import { useRealtimeNotifications } from "@/hooks/api/use-realtime"
const { unreadCount } = useRealtimeNotifications(userId)
```

## 📊 API Endpoints

### Athletes
- `GET /api/athletes` - Lista atleti
- `POST /api/athletes` - Crea atleta
- `GET /api/athletes/[id]` - Dettagli atleta
- `PATCH /api/athletes/[id]` - Aggiorna atleta
- `DELETE /api/athletes/[id]` - Elimina atleta (soft delete)
- `GET /api/athletes/[id]/stats` - Statistiche atleta

### Registrations
- `GET /api/registrations` - Lista iscrizioni
- `POST /api/registrations` - Nuova iscrizione
- `GET /api/registrations/me` - Mie iscrizioni
- `GET /api/registrations/[id]` - Dettagli iscrizione
- `PATCH /api/registrations/[id]` - Aggiorna iscrizione
- `DELETE /api/registrations/[id]` - Cancella iscrizione

### Attempts
- `POST /api/attempts` - Crea tentativo
- `GET /api/attempts/[id]` - Dettagli tentativo
- `PATCH /api/attempts/[id]` - Aggiorna tentativo
- `PATCH /api/attempts/[id]/judge` - Giudica tentativo
- `DELETE /api/attempts/[id]` - Elimina tentativo

### Events
- `GET /api/events/[id]/attempts` - Tentativi evento
- `GET /api/events/[id]/attempts/current` - Tentativo corrente
- `GET /api/events/[id]/registrations` - Iscrizioni evento
- `GET /api/events/[id]/records` - Record evento
- `GET /api/events/[id]/leaderboard` - Classifica evento

### Dashboard & Stats
- `GET /api/dashboard/stats` - Statistiche dashboard
- `GET /api/records/recent` - Record recenti
- `GET /api/notifications` - Notifiche utente
- `GET /api/notifications/unread-count` - Contatore non lette

## 🔐 Ruoli e Permessi

### ADMIN
- Accesso completo a tutte le funzionalità
- Gestione utenti e atleti
- Configurazione sistema

### ORGANIZER
- Creazione e gestione eventi
- Approvazione iscrizioni
- Visualizzazione statistiche

### JUDGE
- Interfaccia giudizio tentativi
- Valutazione lifts
- Visualizzazione risultati live

### ATHLETE
- Iscrizione eventi
- Visualizzazione propri risultati
- Notifiche personalizzate

## 🚀 Deploy su Vercel

```bash
# Collega progetto a Vercel
vercel

# Configura variabili d'ambiente su Vercel dashboard

# Deploy production
vercel --prod
```

### Environment Variables su Vercel
Configura tutte le variabili da `.env.local` nel dashboard Vercel:
- Settings > Environment Variables
- Aggiungi tutte le variabili per Production, Preview e Development

## 📱 Features in Produzione

### Real-time Dashboard
- Statistiche aggiornate automaticamente
- Contatori live: atleti, competizioni attive, risultati oggi, record
- Nessun refresh manuale necessario

### Live Results Page
- Selezione evento attivo
- Leaderboard aggiornata in tempo reale
- Ultimi tentativi con risultati
- Badge "LIVE" animato

### Judge Interface
- Interfaccia dedicata per giudici
- Caricamento automatico prossimo tentativo
- Tre opzioni: GOOD LIFT, NO LIFT, DISQUALIFY
- Notifiche automatiche agli atleti

### Athletes Management
- Lista completa atleti
- Ricerca per nome/email
- Statistiche per atleta
- Gestione CRUD completa

## 🔔 Sistema Notifiche

Le notifiche vengono create automaticamente per:
- Iscrizione approvata/rifiutata
- Risultato tentativo
- Record personale battuto
- Record di gara battuto
- Aggiornamenti eventi

## ⚡ Performance

- Server-side rendering con Next.js 15
- React Query per caching intelligente
- Supabase Realtime per updates ottimizzati
- Skeleton loaders per UX fluida

## 🐛 Troubleshooting

### Realtime non funziona
```bash
# Verifica replication su Supabase
# Controlla che NEXT_PUBLIC_ENABLE_REALTIME="true"
# Verifica connessione WebSocket nel browser console
```

### Errori database
```bash
# Reset database
npm run db:reset

# Push schema
npm run db:push
```

### Permessi negati
```bash
# Verifica RLS policies
npm run setup:rls

# Controlla ruoli utente nel database
```

## 📚 Documentazione Aggiuntiva

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Prisma](https://www.prisma.io/docs)
- [React Query](https://tanstack.com/query/latest)

## 🎉 Pronto per la Produzione!

L'applicazione è ora completamente funzionale con:
- ✅ Zero dati mock
- ✅ Database reale connesso
- ✅ Real-time updates
- ✅ Sistema notifiche
- ✅ Tutte le funzionalità implementate
- ✅ Gestione errori robusta
- ✅ UX professionale
