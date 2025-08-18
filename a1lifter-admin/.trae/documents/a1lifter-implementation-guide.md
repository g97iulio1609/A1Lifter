# A1Lifter - Guida Implementazione e Plugin System

## 1. Plugin System Architecture

### 1.1 Sport-Specific Engines

Ogni sport implementa un'interfaccia comune per garantire modularità e estensibilità:

```typescript
interface SportPlugin {
  validateAttempt(attempt: AttemptData, rules: FederationRules): ValidationResult;
  scoreAttempt(attempt: AttemptData, athlete: AthleteData): ScoreResult;
  calculateRanking(scores: ScoreData[], category: string): RankingResult[];
  proposeNextAttempt(currentAttempt: AttemptData, history: AttemptData[]): WeightProposal;
  resolveTiebreak(tiedAthletes: AthleteData[]): AthleteData[];
  getTimerSettings(): TimerConfig;
}
```

### 1.2 Powerlifting Plugin

```typescript
class PowerliftingPlugin implements SportPlugin {
  validateAttempt(attempt: AttemptData, rules: FederationRules): ValidationResult {
    // Validazione 3 tentativi per alzata
    // Controllo progressione pesi (min 2.5kg)
    // Validazione rack heights
    // Controllo timing dichiarazioni
    return {
      valid: boolean,
      errors: string[],
      warnings: string[]
    };
  }
  
  scoreAttempt(attempt: AttemptData, athlete: AthleteData): ScoreResult {
    // Calcolo best per alzata
    // Calcolo total (squat + bench + deadlift)
    // Applicazione coefficienti (DOTS, Wilks, IPF Points)
    // Controllo record
    return {
      liftBest: number,
      total: number,
      coefficients: { dots: number, wilks: number, ipf: number },
      records: RecordData[]
    };
  }
  
  calculateRanking(scores: ScoreData[], category: string): RankingResult[] {
    // Ordinamento per total DESC
    // Tiebreak: bodyweight ASC, lot ASC
    // Applicazione age coefficients se necessario
    return scores
      .filter(s => s.category === category)
      .sort((a, b) => {
        if (a.total !== b.total) return b.total - a.total;
        if (a.bodyweight !== b.bodyweight) return a.bodyweight - b.bodyweight;
        return a.lot - b.lot;
      })
      .map((score, index) => ({ ...score, rank: index + 1 }));
  }
  
  proposeNextAttempt(currentAttempt: AttemptData, history: AttemptData[]): WeightProposal {
    // Auto-progression logic
    // Successful: +2.5kg to +10kg based on lift and athlete level
    // Failed: -2.5kg to -5kg or repeat weight
    const lastSuccessful = history.filter(a => a.result === 'good').pop();
    const increment = this.calculateIncrement(currentAttempt, lastSuccessful);
    
    return {
      weight: currentAttempt.actualWeight + increment,
      confidence: 0.8,
      reasoning: `Auto-progression based on ${currentAttempt.result} attempt`
    };
  }
  
  getTimerSettings(): TimerConfig {
    return {
      attemptDuration: 60, // 1 minute
      warmupDuration: 900, // 15 minutes
      breakDuration: 300,  // 5 minutes
      warningAt: 30,       // 30 seconds warning
      finalWarningAt: 10   // 10 seconds final warning
    };
  }
}
```

### 1.3 Weightlifting Plugin

```typescript
class WeightliftingPlugin implements SportPlugin {
  validateAttempt(attempt: AttemptData, rules: FederationRules): ValidationResult {
    // Validazione Snatch/Clean&Jerk sequence
    // Controllo progressione barra (min 1kg)
    // Validazione change windows (1min/2min rules)
    // Controllo jury override permissions
  }
  
  scoreAttempt(attempt: AttemptData, athlete: AthleteData): ScoreResult {
    // Calcolo best Snatch e Clean&Jerk
    // Calcolo total (Snatch + C&J)
    // Applicazione Sinclair coefficient
    // Age group coefficients (Youth, Junior, Master)
  }
  
  calculateRanking(scores: ScoreData[], category: string): RankingResult[] {
    // Ordinamento per total DESC
    // Tiebreak: bodyweight ASC, best Snatch DESC, lot ASC
  }
  
  proposeNextAttempt(currentAttempt: AttemptData, history: AttemptData[]): WeightProposal {
    // Conservative progression for technical lifts
    // Snatch: +1kg to +3kg
    // Clean&Jerk: +2kg to +5kg
  }
}
```

### 1.4 Strongman Plugin

```typescript
class StrongmanPlugin implements SportPlugin {
  validateAttempt(attempt: AttemptData, rules: FederationRules): ValidationResult {
    // Validazione per tipo evento (max/reps/time/medley)
    // Controllo equipment specifico
    // Validazione time caps
  }
  
  scoreAttempt(attempt: AttemptData, athlete: AthleteData): ScoreResult {
    // Scoring per evento individuale
    // Points system (1st = n points, 2nd = n-1, etc.)
    // Aggregazione overall ranking
  }
  
  calculateRanking(scores: ScoreData[], category: string): RankingResult[] {
    // Somma punti per tutti gli eventi
    // Tiebreak: numero di primi posti, secondi posti, etc.
  }
}
```

### 1.5 CrossFit Plugin

```typescript
class CrossFitPlugin implements SportPlugin {
  validateAttempt(attempt: AttemptData, rules: FederationRules): ValidationResult {
    // Validazione WOD type (AMRAP/For Time/EMOM)
    // Controllo movement standards
    // Validazione time caps e penalties
  }
  
  scoreAttempt(attempt: AttemptData, athlete: AthleteData): ScoreResult {
    // Scoring basato su WOD type
    // AMRAP: reps completed
    // For Time: time to completion (+ penalties)
    // Scaled/RX divisions
  }
}
```

## 2. Performance Requirements Implementation

### 2.1 Core Web Vitals Optimization

```typescript
// vite.config.ts - Build optimization
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer per CI
    bundleAnalyzer({
      analyzerMode: process.env.ANALYZE ? 'server' : 'disabled'
    })
  ],
  build: {
    // Code splitting per route
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts']
        }
      }
    },
    // Budget enforcement
    chunkSizeWarningLimit: 170 // KB
  },
  // Critical CSS inlining
  css: {
    postcss: {
      plugins: [
        criticalCss({
          inline: true,
          minify: true
        })
      ]
    }
  }
});
```

### 2.2 Image Optimization

```typescript
// Image component with lazy loading and responsive sizes
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  
  useEffect(() => {
    // Generate responsive srcset with AVIF/WebP fallbacks
    const generateSrcSet = (baseSrc: string) => {
      const sizes = [320, 640, 768, 1024, 1280];
      return sizes.map(size => {
        const avif = `${baseSrc}?w=${size}&f=avif`;
        const webp = `${baseSrc}?w=${size}&f=webp`;
        const jpg = `${baseSrc}?w=${size}&f=jpg`;
        return `${avif} ${size}w, ${webp} ${size}w, ${jpg} ${size}w`;
      }).join(', ');
    };
    
    setImageSrc(generateSrcSet(src));
  }, [src]);
  
  return (
    <picture>
      <source srcSet={imageSrc} type="image/avif" />
      <source srcSet={imageSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        style={{
          transition: 'opacity 0.3s ease',
          opacity: isLoaded ? 1 : 0
        }}
      />
    </picture>
  );
};
```

### 2.3 Route-Level Code Splitting

```typescript
// Router setup with lazy loading
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LiveSession = lazy(() => import('./pages/LiveSession'));
const JudgeInterface = lazy(() => import('./pages/JudgeInterface'));
const PublicView = lazy(() => import('./pages/PublicView'));
const BackstageMonitor = lazy(() => import('./pages/BackstageMonitor'));

// Preload critical routes
const preloadRoutes = () => {
  import('./pages/LiveSession');
  import('./pages/JudgeInterface');
};

// Router configuration
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <Dashboard />
      </Suspense>
    ),
    loader: () => {
      preloadRoutes();
      return null;
    }
  },
  {
    path: '/live/:eventId',
    element: (
      <Suspense fallback={<LiveSkeleton />}>
        <LiveSession />
      </Suspense>
    )
  },
  {
    path: '/judge/:sessionId',
    element: (
      <Suspense fallback={<JudgeSkeleton />}>
        <JudgeInterface />
      </Suspense>
    )
  }
]);
```

## 3. Real-Time & Offline Implementation

### 3.1 PWA Configuration

```typescript
// vite-plugin-pwa configuration
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      manifest: {
        name: 'A1Lifter - Competition Management',
        short_name: 'A1Lifter',
        description: 'Professional strength sports competition management',
        theme_color: '#007AFF',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

### 3.2 Offline-First Judge Interface

```typescript
// Offline queue for judge decisions
class OfflineJudgeQueue {
  private queue: JudgementData[] = [];
  private isOnline = navigator.onLine;
  
  constructor() {
    window.addEventListener('online', this.processQueue.bind(this));
    window.addEventListener('offline', () => { this.isOnline = false; });
  }
  
  async submitJudgement(judgement: JudgementData): Promise<void> {
    if (this.isOnline) {
      try {
        await this.sendToFirestore(judgement);
        this.showSuccessToast('Judgement submitted');
      } catch (error) {
        this.queue.push(judgement);
        this.showWarningToast('Queued for sync');
      }
    } else {
      this.queue.push(judgement);
      this.showInfoToast('Saved offline - will sync when online');
    }
  }
  
  private async processQueue(): Promise<void> {
    this.isOnline = true;
    
    while (this.queue.length > 0) {
      const judgement = this.queue.shift()!;
      try {
        await this.sendToFirestore(judgement);
      } catch (error) {
        // Re-queue if still failing
        this.queue.unshift(judgement);
        break;
      }
    }
    
    if (this.queue.length === 0) {
      this.showSuccessToast('All judgements synced');
    }
  }
  
  private async sendToFirestore(judgement: JudgementData): Promise<void> {
    const db = getFirestore();
    await addDoc(collection(db, 'judgements'), {
      ...judgement,
      timestamp: serverTimestamp(),
      synced: true
    });
  }
}
```

### 3.3 Real-Time Timer Synchronization

```typescript
// Server-synchronized timer
class SyncedTimer {
  private serverOffset = 0;
  private localStartTime = 0;
  private duration = 0;
  private callbacks: ((timeLeft: number) => void)[] = [];
  
  constructor(private sessionId: string) {
    this.syncWithServer();
  }
  
  private async syncWithServer(): Promise<void> {
    const start = Date.now();
    const serverTime = await this.getServerTime();
    const end = Date.now();
    
    // Account for network latency
    const networkDelay = (end - start) / 2;
    this.serverOffset = serverTime - (end - networkDelay);
  }
  
  async startTimer(duration: number): Promise<void> {
    const response = await this.callCloudFunction('startTimer', {
      sessionId: this.sessionId,
      duration
    });
    
    this.duration = duration;
    this.localStartTime = this.getServerTime();
    this.tick();
  }
  
  private tick(): void {
    const elapsed = (this.getServerTime() - this.localStartTime) / 1000;
    const timeLeft = Math.max(0, this.duration - elapsed);
    
    this.callbacks.forEach(callback => callback(timeLeft));
    
    if (timeLeft > 0) {
      requestAnimationFrame(() => this.tick());
    }
  }
  
  private getServerTime(): number {
    return Date.now() + this.serverOffset;
  }
  
  onTick(callback: (timeLeft: number) => void): void {
    this.callbacks.push(callback);
  }
}
```

## 4. Testing Strategy

### 4.1 Unit Testing Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});

// src/test/setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

// Setup Firebase emulators for testing
beforeAll(() => {
  const db = getFirestore();
  const auth = getAuth();
  
  if (!db._delegate._databaseId.projectId.includes('demo-')) {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
});

afterEach(() => {
  cleanup();
});
```

### 4.2 Component Testing

```typescript
// src/components/__tests__/JudgeInterface.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { JudgeInterface } from '../JudgeInterface';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('JudgeInterface', () => {
  it('should submit good lift judgement', async () => {
    const mockSubmit = vi.fn();
    
    renderWithProviders(
      <JudgeInterface 
        sessionId="test-session" 
        onJudgement={mockSubmit}
      />
    );
    
    const goodButton = screen.getByRole('button', { name: /good lift/i });
    fireEvent.click(goodButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        decision: 'good',
        timestamp: expect.any(Number)
      });
    });
  });
  
  it('should work offline', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    const mockSubmit = vi.fn();
    
    renderWithProviders(
      <JudgeInterface 
        sessionId="test-session" 
        onJudgement={mockSubmit}
      />
    );
    
    const goodButton = screen.getByRole('button', { name: /good lift/i });
    fireEvent.click(goodButton);
    
    // Should show offline indicator
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
    
    // Should queue judgement
    expect(mockSubmit).toHaveBeenCalledWith({
      decision: 'good',
      queued: true,
      timestamp: expect.any(Number)
    });
  });
});
```

### 4.3 E2E Testing with Playwright

```typescript
// e2e/competition-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Competition Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data in Firebase emulator
    await page.goto('/test-setup');
    await page.click('[data-testid="seed-test-data"]');
  });
  
  test('complete competition workflow', async ({ page }) => {
    // 1. Create competition
    await page.goto('/competitions/new');
    await page.fill('[name="name"]', 'Test Competition 2024');
    await page.selectOption('[name="sport"]', 'powerlifting');
    await page.click('[data-testid="create-competition"]');
    
    // 2. Add athletes
    await page.click('[data-testid="manage-athletes"]');
    await page.click('[data-testid="add-athlete"]');
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'Athlete');
    await page.fill('[name="bodyweight"]', '75.0');
    await page.click('[data-testid="save-athlete"]');
    
    // 3. Start live session
    await page.goto('/live/test-competition-2024');
    await page.click('[data-testid="start-session"]');
    
    // 4. Judge attempt
    await page.goto('/judge/test-session');
    await page.click('[data-testid="good-lift"]');
    
    // 5. Verify results
    await page.goto('/public/test-competition-2024');
    await expect(page.locator('[data-testid="leaderboard"]')).toContainText('Test Athlete');
    
    // 6. Performance check
    const performanceMetrics = await page.evaluate(() => {
      return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]));
    });
    
    expect(performanceMetrics.loadEventEnd - performanceMetrics.loadEventStart).toBeLessThan(2500);
  });
  
  test('offline judge functionality', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true);
    
    await page.goto('/judge/test-session');
    await page.click('[data-testid="good-lift"]');
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Should sync automatically
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
  });
});
```

## 5. SEO & Analytics Implementation

### 5.1 Schema.org Structured Data

```typescript
// src/components/SEO/StructuredData.tsx
interface SportsEventSchema {
  event: EventData;
  athletes: AthleteData[];
  results?: ResultData[];
}

const SportsEventStructuredData: React.FC<SportsEventSchema> = ({ 
  event, 
  athletes, 
  results 
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": event.name,
    "description": `${event.sport} competition featuring ${athletes.length} athletes`,
    "startDate": event.startAt.toISOString(),
    "endDate": event.endAt.toISOString(),
    "location": {
      "@type": "Place",
      "name": event.venue.name,
      "address": event.venue.address
    },
    "organizer": {
      "@type": "Organization",
      "name": "A1Lifter",
      "url": "https://a1lifter.com"
    },
    "competitor": athletes.map(athlete => ({
      "@type": "Person",
      "name": `${athlete.profile.firstName} ${athlete.profile.lastName}`,
      "nationality": athlete.profile.nationality
    })),
    ...(results && {
      "subEvent": results.map(result => ({
        "@type": "SportsEvent",
        "name": `${result.category} Results`,
        "winner": {
          "@type": "Person",
          "name": result.winner.name
        }
      }))
    })
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
```

### 5.2 Analytics Implementation

```typescript
// src/lib/analytics.ts
import { gtag } from 'ga-gtag';

class AnalyticsService {
  private isInitialized = false;
  
  init(measurementId: string): void {
    if (this.isInitialized) return;
    
    gtag('config', measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      consent_mode: {
        analytics_storage: 'denied',
        ad_storage: 'denied'
      }
    });
    
    this.isInitialized = true;
  }
  
  updateConsent(granted: boolean): void {
    gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied',
      ad_storage: granted ? 'granted' : 'denied'
    });
  }
  
  trackEvent(action: string, category: string, label?: string, value?: number): void {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
  
  // Competition-specific events
  trackCompetitionCreated(sport: string): void {
    this.trackEvent('create', 'competition', sport);
  }
  
  trackAthleteRegistration(sport: string, category: string): void {
    this.trackEvent('register', 'athlete', `${sport}_${category}`);
  }
  
  trackJudgement(decision: string, sport: string): void {
    this.trackEvent('judge', 'attempt', `${sport}_${decision}`);
  }
  
  trackLiveView(eventId: string): void {
    this.trackEvent('view', 'live_results', eventId);
  }
  
  trackExport(format: string, type: string): void {
    this.trackEvent('export', 'results', `${type}_${format}`);
  }
}

export const analytics = new AnalyticsService();
```

## 6. Accessibility Implementation

### 6.1 WCAG AA Compliance

```typescript
// src/components/ui/AccessibleButton.tsx
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  ariaLabel,
  ariaDescribedBy
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ];
  
  const variantClasses = {
    primary: [
      'bg-blue-600 text-white hover:bg-blue-700',
      'focus:ring-blue-500'
    ],
    secondary: [
      'bg-gray-200 text-gray-900 hover:bg-gray-300',
      'focus:ring-gray-500'
    ],
    danger: [
      'bg-red-600 text-white hover:bg-red-700',
      'focus:ring-red-500'
    ]
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]',
    xl: 'px-8 py-4 text-xl min-h-[60px]' // For judge interface
  };
  
  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size]
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      type="button"
    >
      {children}
    </button>
  );
};
```

### 6.2 Screen Reader Support

```typescript
// src/components/LiveAnnouncer.tsx
const LiveAnnouncer: React.FC = () => {
  const [announcement, setAnnouncement] = useState('');
  
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'liveFeed'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            
            switch (data.type) {
              case 'attempt_result':
                setAnnouncement(
                  `${data.athleteName} ${data.result} lift at ${data.weight} kilograms`
                );
                break;
              case 'new_record':
                setAnnouncement(
                  `New ${data.recordType} record by ${data.athleteName}: ${data.weight} kilograms`
                );
                break;
              case 'session_start':
                setAnnouncement(`${data.sessionName} has started`);
                break;
            }
          }
        });
      }
    );
    
    return unsubscribe;
  }, []);
  
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};
```

## 7. Security Implementation

### 7.1 Content Security Policy

```typescript
// vite.config.ts - CSP headers
export default defineConfig({
  plugins: [
    {
      name: 'csp-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://storage.googleapis.com",
              "connect-src 'self' https://*.googleapis.com wss://*.googleapis.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          );
          next();
        });
      }
    }
  ]
});
```

### 7.2 Input Validation

```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const AttemptSchema = z.object({
  athleteId: z.string().uuid(),
  sessionId: z.string().uuid(),
  liftType: z.enum(['squat', 'bench', 'deadlift', 'snatch', 'cleanjerk']),
  attemptNumber: z.number().int().min(1).max(3),
  declaredWeight: z.number().positive().max(1000),
  actualWeight: z.number().positive().max(1000),
  rackHeight: z.number().int().min(1).max(20).optional()
});

export const JudgementSchema = z.object({
  attemptId: z.string().uuid(),
  judgeId: z.string().uuid(),
  decision: z.enum(['good', 'no_lift']),
  reason: z.string().optional(),
  timestamp: z.number().positive()
});

// Cloud Function validation
export const validateAttempt = (data: unknown): AttemptData => {
  try {
    return AttemptSchema.parse(data);
  } catch (error) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid attempt data',
      error
    );
  }
};
```

Questa documentazione fornisce una guida completa per l'implementazione del refactor della piattaforma A1Lifter, coprendo tutti gli aspetti tecnici specificati nel prompt ottimizzato.