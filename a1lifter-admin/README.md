# A1Lifter - Admin Panel

Sistema di gestione per meeting di powerlifting e strongman.

## Tecnologie Utilizzate

- **React 19** con TypeScript
- **Vite** come bundler
- **Tailwind CSS v4** per styling
- **Shadcn/ui** per componenti UI
- **Firebase** per backend (Auth, Firestore, Storage)
- **React Router** per routing
- **TanStack Query** per state management
- **React Hook Form** per gestione form
- **Zod** per validazione
- **Lucide React** per icone

## Setup del Progetto

1. **Installazione dipendenze:**
   ```bash
   npm install
   ```

2. **Configurazione Firebase:**
   - Copia `.env.example` in `.env`
   - Configura le variabili Firebase

3. **Avvio sviluppo:**
   ```bash
   npm run dev
   ```

## Struttura del Progetto

```
src/
├── components/
│   ├── ui/              # Componenti Shadcn/ui
│   ├── layout/          # Layout components
│   ├── forms/           # Form components
│   ├── charts/          # Grafici e visualizzazioni
│   └── auth/            # Componenti autenticazione
├── pages/
│   ├── dashboard/       # Dashboard principale
│   ├── athletes/        # Gestione atleti
│   ├── competitions/    # Gestione competizioni
│   └── results/         # Gestione risultati
├── contexts/            # React contexts
├── hooks/              # Custom hooks
├── services/           # Servizi Firebase
├── types/              # TypeScript types
├── constants/          # Costanti applicazione
└── config/             # Configurazioni
```

## Funzionalità Implementate

### ✅ Fase 1 - Setup e Autenticazione
- Setup progetto React + Vite + TypeScript
- Configurazione Tailwind CSS v4
- Setup Firebase SDK
- Installazione e configurazione Shadcn/ui
- Sistema di autenticazione Firebase
- Layout base con sidebar
- Routing con React Router
- Dashboard principale
- Struttura cartelle completa

### ✅ Fase 2 - Gestione Atleti
- Servizi Firebase per CRUD atleti
- Hook personalizzati con TanStack Query
- Tabella atleti con filtri e ricerca
- Form per aggiunta/modifica atleti
- Sistema di notifiche (toast)
- Validazione form con Zod
- Statistiche atleti in tempo reale
- Interfaccia responsive

### ✅ Fase 3 - Gestione Competizioni
- Servizi Firebase per CRUD competizioni
- Hook personalizzati per competizioni
- Form avanzato con tabs per competizioni
- Configurazione categorie e regole
- Sistema di duplicazione competizioni
- Tabella competizioni con azioni
- Statistiche competizioni in tempo reale
- Gestione stati competizione (bozza, attiva, completata)

### ✅ Fase 4 - Sistema di Iscrizioni e Risultati
- Servizi Firebase per gestione risultati
- Sistema di iscrizioni atleti alle competizioni
- Componenti UI per gestione risultati
- Sistema di scoring completo (IPF, Wilks, DOTS)
- Classifiche automatiche per categoria
- Form per inserimento tentativi
- Gestione tentativi validi/non validi
- Statistiche avanzate risultati

### ✅ Fase 5 - Dashboard Organizzatore e Export
- Dashboard organizzatore in tempo reale
- Sistema di export classifiche (PDF, Excel)
- Gestione peso corporeo atleti con validazione
- Importazione CSV atleti con template
- Timeline attività competizione
- Statistiche live e progressi categoria
- Report completo competizione
- Sistema di alert e notifiche

## Caratteristiche Principali Implementate

### 🏆 **Gestione Competizioni Complete**
- Creazione e configurazione competizioni
- Gestione categorie dinamiche
- Regole personalizzabili per disciplina
- Stati competizione (bozza, attiva, completata)

### 👥 **Gestione Atleti Avanzata**
- CRUD completo atleti
- Importazione CSV con validazione
- Gestione peso corporeo con controlli
- Filtri e ricerca avanzati

### 📊 **Sistema di Risultati Professionale**
- Inserimento tentativi in tempo reale
- Calcolo automatico punteggi (IPF, Wilks, DOTS)
- Classifiche automatiche per categoria
- Statistiche dettagliate

### 🎯 **Dashboard Organizzatore Live**
- Monitoraggio tempo reale competizioni
- Progresso per categoria
- Timeline attività
- Alert automatici

### 📄 **Sistema di Export Completo**
- Export PDF classifiche
- Export Excel con dettagli
- Report completo competizione
- Template CSV per importazione

## Funzionalità Avanzate

- **Calcolo Punteggi**: Formule ufficiali IPF, Wilks, DOTS
- **Validazione Peso**: Controllo automatico categorie
- **Export Professionale**: PDF e Excel formattati
- **Import Intelligente**: CSV con validazione errori
- **Dashboard Live**: Aggiornamenti ogni 15-30 secondi
- **Statistiche Avanzate**: Percentuali successo, record
- **Timeline Attività**: Cronologia eventi competizione

## Variabili d'Ambiente

Crea un file `.env` con:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```