/**
 * Service Worker for A1Lifter PWA
 * Implements offline-first strategy with intelligent caching
 */

const CACHE_NAME = 'a1lifter-v1';
const STATIC_CACHE = 'a1lifter-static-v1';
const DYNAMIC_CACHE = 'a1lifter-dynamic-v1';
const API_CACHE = 'a1lifter-api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Critical CSS and JS will be added dynamically
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/events',
  '/api/athletes',
  '/api/competitions',
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

// Route patterns and their strategies
const ROUTE_STRATEGIES = [
  {
    pattern: /\.(js|css|woff2?|ttf|eot)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  {
    pattern: /\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cache: STATIC_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  {
    pattern: /\/api\//,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cache: API_CACHE,
    maxAge: 5 * 60 * 1000, // 5 minutes
  },
  {
    pattern: /\/(judges|public|warmup)/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cache: DYNAMIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE
              );
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Find matching route strategy
  const routeStrategy = ROUTE_STRATEGIES.find((route) => {
    return route.pattern.test(url.pathname + url.search);
  });
  
  if (routeStrategy) {
    event.respondWith(handleRequest(request, routeStrategy));
  } else {
    // Default strategy for unmatched routes
    event.respondWith(
      handleRequest(request, {
        strategy: CACHE_STRATEGIES.NETWORK_FIRST,
        cache: DYNAMIC_CACHE,
        maxAge: 60 * 60 * 1000, // 1 hour
      })
    );
  }
});

// Handle requests based on strategy
async function handleRequest(request, routeConfig) {
  const { strategy, cache: cacheName, maxAge } = routeConfig;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request);
    
    default:
      return fetch(request);
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, serving cached version:', error);
    return cachedResponse || createOfflineResponse(request);
  }
}

// Network First strategy
async function networkFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse;
    }
    
    return createOfflineResponse(request);
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network in background
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Background fetch failed:', error);
    });
  
  // Return cached version immediately if available and not expired
  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }
  
  // Wait for network if no cache or expired
  try {
    return await networkPromise;
  } catch (error) {
    return cachedResponse || createOfflineResponse(request);
  }
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  if (!maxAge) return false;
  
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const date = new Date(dateHeader);
  const now = new Date();
  
  return (now.getTime() - date.getTime()) > maxAge;
}

// Create offline response
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  // For HTML pages, return offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    return caches.match('/offline.html');
  }
  
  // For API requests, return JSON error
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This request is not available offline',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  // For other resources, return generic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'judge-decisions') {
    event.waitUntil(syncJudgeDecisions());
  }
  
  if (event.tag === 'athlete-data') {
    event.waitUntil(syncAthleteData());
  }
});

// Sync judge decisions when back online
async function syncJudgeDecisions() {
  try {
    const decisions = await getStoredDecisions();
    
    for (const decision of decisions) {
      try {
        await fetch('/api/judge-decisions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(decision),
        });
        
        // Remove from local storage after successful sync
        await removeStoredDecision(decision.id);
      } catch (error) {
        console.log('[SW] Failed to sync decision:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Sync failed:', error);
  }
}

// Sync athlete data when back online
async function syncAthleteData() {
  try {
    const athleteData = await getStoredAthleteData();
    
    for (const data of athleteData) {
      try {
        await fetch('/api/athletes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        await removeStoredAthleteData(data.id);
      } catch (error) {
        console.log('[SW] Failed to sync athlete data:', error);
      }
    }
  } catch (error) {
    console.log('[SW] Athlete sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getStoredDecisions() {
  // Implementation would use IndexedDB
  return [];
}

async function removeStoredDecision(id) {
  // Implementation would use IndexedDB
}

async function getStoredAthleteData() {
  // Implementation would use IndexedDB
  return [];
}

async function removeStoredAthleteData(id) {
  // Implementation would use IndexedDB
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'New competition update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification('A1Lifter Update', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/competitions')
    );
  }
});