module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/events',
        'http://localhost:4173/live',
        'http://localhost:4173/judges',
        'http://localhost:4173/athletes'
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    assert: {
      assertions: {
        // Core Web Vitals targets
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        
        // Performance budget
        'resource-summary:script:size': ['error', { maxNumericValue: 174080 }], // 170KB gzipped
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 51200 }], // 50KB gzipped
        'resource-summary:font:size': ['error', { maxNumericValue: 204800 }], // 200KB for 2 fonts
        'resource-summary:image:size': ['warn', { maxNumericValue: 512000 }], // 500KB images
        'resource-summary:total:size': ['warn', { maxNumericValue: 2048000 }], // 2MB total
        
        // Lighthouse scores (Mobile targets)
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:pwa': ['warn', { minScore: 0.90 }],
        
        // Critical rendering path
        'render-blocking-resources': 'off', // We handle this with critical CSS
        'unused-css-rules': ['warn', { maxLength: 5 }],
        'unused-javascript': ['warn', { maxLength: 5 }],
        
        // Images and media
        'modern-image-formats': 'error',
        'uses-optimized-images': 'error',
        'uses-responsive-images': 'error',
        'efficient-animated-content': 'error',
        
        // Caching and compression
        'uses-long-cache-ttl': 'warn',
        'uses-text-compression': 'error',
        
        // JavaScript and CSS
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'removes-unused-css': 'warn',
        'legacy-javascript': 'error',
        
        // Network and loading
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',
        'preload-lcp-image': 'error',
        'prioritize-lcp-image': 'error',
        
        // PWA specific
        'service-worker': 'error',
        'installable-manifest': 'error',
        'splash-screen': 'error',
        'themed-omnibox': 'error',
        'maskable-icon': 'warn',
        
        // Accessibility
        'color-contrast': 'error',
        'heading-order': 'error',
        'link-name': 'error',
        'button-name': 'error',
        'image-alt': 'error',
        'label': 'error',
        
        // SEO
        'document-title': 'error',
        'meta-description': 'error',
        'http-status-code': 'error',
        'link-text': 'error',
        'is-crawlable': 'error',
        'hreflang': 'warn',
        'canonical': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db'
      }
    },
    wizard: {
      // Configuration for LHCI wizard
    }
  },
  
  // Mobile-specific configuration
  mobile: {
    collect: {
      settings: {
        preset: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 562.5,
          downloadThroughputKbps: 1474.56,
          uploadThroughputKbps: 675
        },
        emulatedFormFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false
        }
      }
    },
    assert: {
      assertions: {
        // Stricter mobile targets
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'speed-index': ['error', { maxNumericValue: 4000 }],
        'categories:performance': ['error', { minScore: 0.95 }]
      }
    }
  }
};