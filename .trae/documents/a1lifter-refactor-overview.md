# A1Lifter Platform Refactor - Overview Tecnico

## Panoramica del Progetto

A1Lifter è una piattaforma multisport per la gestione di competizioni di strength & functional fitness che supporta Powerlifting, Weightlifting, Strongman, CrossFit e Streetlifting. Il refactor mira a creare un'esperienza "one-click" moderna mantenendo performance elevate e architettura pulita.

## Architettura del Sistema

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│           Interface Layer               │
│  (React Components, Pages, Hooks)      │
├─────────────────────────────────────────┤
│         Application Layer               │
│    (Use Cases, Services, State)         │
├─────────────────────────────────────────┤
│           Domain Layer                  │
│   (Entities, Value Objects, Rules)      │
├─────────────────────────────────────────┤
│        Infrastructure Layer             │
│  (Firebase, External APIs, Storage)     │
└─────────────────────────────────────────┘
```

### Stack Tecnologico

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + Radix UI
- **Backend**: Firebase (Firestore + Cloud Functions + Auth + Storage)
- **State Management**: TanStack Query + React Hook Form + Zustand
- **Testing**: Vitest + React Testing Library + Playwright E2E
- **Performance**: PWA offline-first, Lighthouse Mobile ≥95

## Tre Interfacce Chiave

### 1. Judges UI (Offline-First)
- Interface per giudici con funzionalità offline
- Sincronizzazione automatica quando online
- Gestione tentativi e scoring in tempo reale

### 2. Public Live UI (SEO-Ready)
- Visualizzazione pubblica delle competizioni
- Ottimizzata per SEO con Schema.org
- Real-time updates per spettatori

### 3. Warm-up/Backstage Monitors
- Schermi grandi per atleti e staff
- Bassa latenza per aggiornamenti critici
- Interface semplificata per visualizzazione

## Sistema Plugin per Sport

Ogni sport implementa l'interfaccia `SportPlugin`:

```typescript
interface SportPlugin {
  validateAttempt(attempt: Attempt): ValidationResult;
  calculateScore(attempts: Attempt[]): Score;
  determineRanking(scores: Score[]): Ranking[];
  getAttemptRules(): AttemptRules;
}
```

**Sport Supportati**:
- Powerlifting (Squat, Bench, Deadlift)
- Weightlifting (Snatch, Clean & Jerk)
- Strongman (eventi multipli)
- CrossFit (WODs e scoring)
- Streetlifting (varianti powerlifting)

## Performance Requirements

### Core Web Vitals
- **LCP**: ≤2.5s
- **CLS**: ≤0.1
- **INP**: ≤200ms
- **TTFB**: ≤0.8s

### Budget Risorse
- **JavaScript**: ≤170KB gzipped
- **CSS**: ≤50KB gzipped
- **Fonts**: ≤2 font families

### Tecniche di Ottimizzazione
- Route-level code splitting
- Image optimization (AVIF/WebP)
- Critical CSS inline
- Service Worker per caching

## Firebase Implementation

### Firestore Collections
```
events/
├── sessions/
├── registrations/
├── athletes/
├── attempts/
├── scores/
└── leaderboards/
```

### Security & Auth
- RBAC con custom claims
- Firestore Security Rules
- Content Security Policy headers
- Input validation con Zod

### Real-time Features
- Snapshot listeners per aggiornamenti live
- Server timestamps per sincronizzazione
- Background sync per offline support

## Testing Strategy

### Livelli di Test
1. **Unit Tests**: Vitest per logica business
2. **Component Tests**: React Testing Library
3. **E2E Tests**: Playwright contro Firebase staging
4. **Performance Tests**: Lighthouse CI

### Firebase Testing
- Emulatori locali per sviluppo
- Staging environment per E2E
- No mocks per garantire fedeltà

## SEO & Analytics

### SEO Implementation
- Schema.org structured data
- Open Graph e Twitter Cards
- Sitemap dinamica
- Meta tags ottimizzati

### Analytics & Compliance
- Google Analytics 4
- GDPR compliance
- Cookie consent management
- Privacy policy integration

## Accessibility & UX

### WCAG AA Compliance
- Screen reader support
- Keyboard navigation
- Color contrast ratios
- Focus management

### Design System
- Componenti Radix UI accessibili
- Design tokens consistenti
- Responsive design mobile-first
- Dark/light mode support

## Deployment & Operations

### CI/CD Pipeline
- GitHub Actions per build e test
- Firebase Hosting per deploy
- Environment-specific configurations
- Automated performance monitoring

### Monitoring & Observability
- Firebase Performance Monitoring
- Error tracking con Sentry
- Real User Monitoring (RUM)
- Custom metrics dashboard

## Prossimi Passi

1. **Setup Ambiente**: Configurazione Firebase e tooling
2. **Core Architecture**: Implementazione layer Clean Architecture
3. **Plugin System**: Sviluppo motori sport-specifici
4. **UI Components**: Creazione design system
5. **Real-time Features**: Implementazione sincronizzazione
6. **Testing Setup**: Configurazione suite di test
7. **Performance Optimization**: Implementazione budget e metriche
8. **SEO & Analytics**: Integrazione tracking e SEO

## Documentazione Correlata

- [Architettura Tecnica Dettagliata](./a1lifter-technical-architecture.md)
- [Guida Implementazione](./a1lifter-implementation-guide.md)
- [Product Requirements](./a1lifter-product-requirements.md)

---

*Questo documento fornisce una panoramica completa del refactor A1Lifter seguendo i principi KISS, SOLID, DRY e Clean Architecture per garantire maintainability, scalability e performance ottimali.*