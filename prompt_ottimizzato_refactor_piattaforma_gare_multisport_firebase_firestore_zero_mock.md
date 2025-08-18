# Prompt ottimizzato — Refactor piattaforma gare multisport

**Ruolo**: Senior Product Designer + Full‑Stack Architect.

**Scopo**: rifattorizzare **Home** e l’intera **web app** di una piattaforma per pianificare, gestire e trasmettere eventi di strength & functional fitness (Powerlifting, Weightlifting, Strongman, CrossFit, Streetlifting) **end‑to‑end sui dati reali di Firebase/Firestore** (nessun mock). Esperienza “**one‑click**”, moderna e levigata, ispirata ai migliori portali sport/event.

---

## 1) Performance & Quality Bar (non negoziabili)
- **Lighthouse Mobile ≥ 95** (Overall).
- **Core Web Vitals**: LCP ≤ 2.5s · CLS ≤ 0.1 · INP ≤ 200ms · TTFB ≤ 0.8s.
- **Budgets**: JS ≤ 170KB gz (initial route) · CSS ≤ 50KB gz · **Fonts ≤ 2** (display=swap) · immagini responsive/lazy, **zero layout shift**.
- **Tecniche**: prefetch route critiche; **route‑level code‑splitting**; tree‑shaking; image CDN + AVIF/WebP; **inline critical CSS**; defer/idle per JS non critico; HTTP/2 Push/103 Early Hints dove supportato.
- **Build‑time guardrails**: bundle analyzer in CI, break build se si sfora budget; report CWV su ogni preview; smoke test PWA/offline.

---

## 2) Architettura (KISS, SOLID, DRY, Clean Architecture)
**Layer**
1. **Domain**: entità/value objects/regole (core agnostico + **plugin sport/federazione**).
2. **Application**: use‑cases/servizi che orchestrano il dominio (scheduling, scoring, publishing).
3. **Interface/Presentation**: UI (pages/components), controllers, view‑models. Tre superfici:
   - **Judges UI** (operatività campo, pulsanti XL, offline‑first),
   - **Public Live UI** (risultati live SEO‑ready),
   - **Warm‑up/Backstage Monitors** (leaderboard + progress in tempo reale, kiosk/big‑screen).
4. **Infrastructure**: **Firebase** (Auth, **Firestore** source of truth, Cloud Functions, Storage, Hosting, Remote Config). RTDB **solo** se strettamente necessario per ticker ultra‑low‑latency (Firestore resta autoritativo).

**Modularità (feature folders)**
`events`, `athletes`, `registrations`, `sessions`, `flights-heats`, `judging`, `attempts`, `timing`, `scoring`, `leaderboard`, `live`, `monitors`, `reports`, `staffing`, `payments`.

**UI & Design System**
- Design tokens (spaziatura, tipografia, colori/tema alto contrasto, states).
- Libreria componenti condivisa (accessibile, focus ring, motion ridotta opzionale).
- Rendering: SSR/Server Components dove possibile; min. stato globale; data hooks per pagina; cache & revalidation.

---

## 3) Firebase (requisiti duri)
- **No mocks**: collegarsi a `FIREBASE_PROJECT_ID` (staging/prod) via SDK **modulare**. Config in `.env`; flag e runtime tuning via **Remote Config**.
- **Auth**: Email/Password + OAuth; **RBAC con custom claims**: `organizer`, `headJudge`, `judge`, `scorer`, `volunteer`, `viewer`.
- **Firestore**: single source of truth; snapshot listeners per tutte le UI realtime; **indici composti** per query critiche; denormalizzazioni mirate.
- **Cloud Functions**:
  - Callable: `startSession`, `startTimer`, `proposeNextAttempt`, `lockWeighIn`, `publishLive`, `approveRecord`.
  - onWrite triggers: calcolo punteggi/coeff, aggiornamento leaderboard, validazione regole tentativi, audit log, denormalizzazioni.
- **Storage**: asset evento (loghi, overlay, certificati, clip) con pipeline immagini ottimizzata.
- **Hosting**: CDN, HTTP/2/3, HSTS + **CSP** rigorosa, COOP/COEP se servono overlay.
- **Security Rules**: least‑privilege per ruolo, ownership per documento, validazioni lato server. Logica sensibile in Functions.

### Sketch Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function hasRole(r) { return request.auth.token.roles[r] == true; }
    function isEventStaff(eventId) {
      return hasRole('organizer') || hasRole('headJudge') ||
             exists(/databases/$(database)/documents/events/$(eventId)/officials/$(request.auth.uid));
    }

    match /events/{eventId} {
      allow read: if true; // pubblico
      allow write: if hasRole('organizer');

      match /sessions/{sessionId} {
        allow read: if true; // live
        allow write: if isEventStaff(eventId);
      }

      match /attempts/{attemptId} {
        allow read: if true;
        allow create, update: if isEventStaff(eventId);
      }

      match /leaderboards/{doc} {
        allow read: if true;
        allow write: if hasRole('scorer') || hasRole('organizer'); // in pratica scrive la Function
      }

      match /judgements/{doc} {
        allow read: if true;
        allow create: if hasRole('judge') || hasRole('headJudge');
        allow update, delete: if hasRole('headJudge');
      }
    }

    match /athletes/{athleteId} {
      allow read: if true;
      allow write: if hasRole('organizer');
    }
  }
}
```

---

## 4) Core Domain Model (indicativo)
Collezioni (top‑level o sotto `events/{eventId}`):
- `events`: { name, sport(s), federationRuleSetId, venue, startAt, endAt, status }
- `sessions`: { eventId, day, startAt, endAt, platforms[], lanes[], state }
- `registrations`: { eventId, athleteId, category/division, weightClass, equipmentClass, teamId, paymentStatus }
- `athletes` (+ `eventAthletes` denormalizzato): { profile, bodyweight, lot, rackHeights, PRs }
- `officials`: { userId, roles[], assignedSessions[] }
- `flights` / `heats`: { sessionId, order[], seededBy, locked }
- `attempts`: { athleteId, sessionId, liftOrWod, attemptNo, declared, actual, result, decision, chips }
- `timers`: { sessionId/platformId, mode, cap, startedAt(server), pausedAt, state }
- `scores`: { athleteId, perEventMetrics, total, coeff, rank }
- `leaderboards`: { sessionId|eventId, category, rows[] } (materializzata)
- `judgements`: { attemptId, judgeId, decision, reason?, createdAt }
- `records`: { level(NR/CR/WR), category, metric, status(pending/approved), evidence }
- `liveFeed`: { type, payload, publishedAt }
- `auditLog`: { actorId, action, entityRef, before/after, ts }

> **Denormalizza dove serve** per letture veloci (es. `leaderboards`, `eventAthletes`); coerenza mantenuta via Functions.

---

## 5) Motori specifici (plugin)
- **Powerlifting**: 3×3, semafori, total, DOTS/GL, auto‑attempt, tie‑break, rack heights, timer piattaforma.
- **Weightlifting**: Snatch/C&J, dichiarazioni/changes, progressione barra, Sinclair/age coeff, jury override.
- **Strongman**: prove (max/reps/time/medley), punteggi per evento, aggregazione overall.
- **CrossFit‑style**: AMRAP/For‑Time/EMOM/Intervals, caps/penalità, rep‑counter, ranking per WOD + overall.
- **Streetlifting**: classi BW, logica tentativi/coeff, tie‑break.

> Ogni plugin espone: `validateAttempt`, `scoreAttempt`, `rank`, `proposeNextAttempt`, `tiebreak`.

---

## 6) “One‑Click” UX (must) + Acceptance
1. **Create Event** (template per sport/federazione, indici auto).
2. **Seed Flights/Heats** da registrazioni (1 click).
3. **Assign Officials** auto per sessione/pedana.
4. **Start Next Attempt/Heat**: set timer, peso/barra, annunci su schermi.
5. **Judgement**: un tap (PL luci · WL decision · CF rep validate · SM complete).
6. **Auto Next Attempt** con proposta carichi.
7. **Publish Live**: leaderboard & overlays.
8. **Awards/Certificates**: generati pronti per stampa/display.

**Criteri di accettazione (esempi)**
- Da **registrazione → pesatura → tentativi → punteggio → premiazione → export** si completa in < **15 minuti** su staging con **100+ atleti** senza errori.
- Latenza percepita monitor/backstage < **300ms**; timer sincroni server‑aligned.
- Nessun **layout shift** durante aggiornamenti live.

---

## 7) Tre interfacce chiave (deliverable)
### A) Judges UI (field ops)
- Full‑screen; pulsanti XL; numpad; haptics; stato tentativo/cronometro visibile.
- Quick‑actions: change, challenge/jury.
- **Offline‑first**: coda operazioni → sync; risoluzione conflitti; feedback retry.

### B) Public Live UI
- Leaderboard real‑time; filtri per categoria/atleta/sessione.
- Pagine atleta con cronologia tentativi; share/OG.
- Anti‑flicker, **streaming‑friendly**, SEO‑ready.

### C) Warm‑up/Backstage Monitors
- Layout big‑screen (auto‑scale), righe scorrevoli.
- **Leaderboard + stato gara** (timer, "on deck / in the hole", bar progression/lane).
- Mirroring per sessione; latenza < 300ms.

---

## 8) Real‑Time, Offline, Affidabilità
- Snapshot Firestore ovunque serva; timers: **serverTimestamp** + timer locale con resync periodico.
- **PWA** per pesatura/giudici/timer; background sync; CRDT/LLW dove sensato.
- Failover: cache locale per continuità punteggi; **audit log** + replay.

---

## 9) SEO, Analytics, Compliance
- Schema.org: `SportsEvent`, `Athlete`, `Organization`, `BreadcrumbList`, `FAQ`, `Article`.
- OG/Twitter, sitemap, robots, canonicals; anti‑flicker/anti‑CLS su SSR.
- **Analytics**: GA4/Plausible; event map: register, check‑in, start session, attempt logged, decision tap, publish live, awards, exports (consent mode).
- **GDPR**: banner cookie, privacy/terms, validazioni input client/server, rate‑limits e anti‑spam in Functions.

---

## 10) Testing & Ops
- **Unit** (domain/app), **component**, **e2e** sui flussi critici **contro Firebase di staging con dati reali** (no fixture/mock). Per dev locale usare **Emulator Suite**.
- CI/CD con preview env; migrazioni DB; seed script idempotenti; controlli budgets.
- Osservabilità: log/metrics/traces per Functions; error boundaries in UI; SLO per sessioni live.

---

## 11) Deliverables
- **Wireframe** + **UI kit** + **design tokens**.
- Codice pulito in feature folders; plugin rules per sport.
- Documentazione: runbook pesatura/giudici/live; guida configurazione federazioni; **security model (RBAC + Rules)**; checklist evento "one‑click".

---

## 12) Definition of Done (checklist sintetica)
- [ ] Lighthouse Mobile ≥ 95 su Home e Live.
- [ ] CWV sotto soglia su dispositivi mid‑range (emulazione Throttling Fast 3G/CPU 4x).
- [ ] Budgets rispettati (JS/CSS/Fonts/Images) con report CI.
- [ ] 3 superfici consegnate e accessibili (WCAG AA: focus, contrasto, ARIA landmarks).
- [ ] RBAC effettivo con custom claims; Rules testate con simulator & emulatore.
- [ ] E2E passano **su staging** con dati reali (seed tool incluso).
- [ ] Observability + alerting per live (latency/timer drift/errori Functions).
- [ ] Runbook evento "one‑click" validato su dry‑run.

---

## 13) Note di implementazione (opzionali ma consigliate)
- Monorepo (pnpm + Turborepo) per web, functions, shared‑lib.
- UI stack: React/TS + design tokens; motion discreta; preferenza Server Components/SSR per cold start veloce.
- **State**: locale + query‑cache per vista; evitare store globali salvo settings/session context.
- **Accessibilità**: riduci animazioni (prefers‑reduced‑motion), aria‑live per aggiornamenti punteggio, shortcut tastiera Judges UI.
- **Sicurezza**: CSP non permissiva; protezione da ID enumeration; verifiche server‑side su tentativi.

---

### Allegato (Functions, indici)
**Functions**
- `onAttemptWrite` → valida regole sport/federazione, calcola total/coeff, aggiorna `scores`/`leaderboards`, logga audit.
- `startTimer` (callable) → imposta `startedAt = serverTimestamp()`, ritorna offset per sync client.
- `proposeNextAttempt` → algoritmo carichi proposti (PL/WL), rispetta change windows.
- `publishLive` → snapshot coerente verso `leaderboards`/`liveFeed`.

**Indici composti (esempi)**
- `attempts`: `sessionId asc, athleteId asc, attemptNo asc`
- `scores`: `eventId asc, category asc, total desc, coeff desc`
- `leaderboards`: `eventId asc, category asc`

---

> **TL;DR**: piattaforma live, real‑time, affidabile e accessibile, costruita su Firestore (autorità), con UX "one‑click" e qualità misurabile (CWV, budgets, test su dati reali).

