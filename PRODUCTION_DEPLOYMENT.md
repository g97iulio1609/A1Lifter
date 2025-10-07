# A1Lifter Production Deployment Guide

## Docker Configuration

### Dockerfile
```dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=https://your-domain.com
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    depends_on:
      - postgres
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=a1lifter
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Vercel Deployment

### vercel.json
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "NEXTAUTH_URL": "@nextauth_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "DATABASE_URL": "@database_url",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Environment Variables

### Production Environment Setup
```bash
# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Database
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App Configuration
NEXT_PUBLIC_APP_NAME=A1Lifter
NEXT_PUBLIC_APP_DESCRIPTION=Multisport Competition Management Platform

# Caching (Redis)
REDIS_URL=redis://user:password@host:6379/0
# Optional: REDIS_PASSWORD=super-secret
# Optional: REDIS_TLS=true
REDIS_NAMESPACE=a1lifter

# CDN (optional)
NEXT_PUBLIC_CDN_URL=https://cdn.example.com/assets
```

## Redis Cache (Multi-instance Ready)

1. Provision a managed Redis instance (Upstash, Redis Cloud, Elasticache, etc.).
2. Populate the environment variables above.
3. Deploy – the application auto-detects Redis and switches `cacheProvider` to `redis`.
4. Monitor connection health via logs (`Redis connection established`) and metrics.

The cache namespace defaults to `a1lifter` to support shared clusters. Override `REDIS_NAMESPACE` if you host multiple environments on the same Redis instance.

## CDN Configuration

1. Point your CDN origin to the Vercel deployment (or container load balancer).
2. Configure the CDN to cache static assets and respect origin cache headers.
3. Set `NEXT_PUBLIC_CDN_URL` (or `CDN_URL`) to the CDN edge URL; the app automatically prefixes `_next` assets, image optimisation routes, and emits immutable cache headers.
4. Purge CDN caches as part of your deployment automation after each release.

## Performance Monitoring

### Setup Vercel Analytics
```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Setup Error Monitoring with Sentry
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

## Security Configuration

### Content Security Policy
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.supabase.co;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: *.supabase.co;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

### Database Security
```sql
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Enable read access for authenticated users" ON users
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON events
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## Monitoring and Logging

### Health Check Endpoint
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'operational',
        auth: 'operational'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 })
  }
}
```

### Logging Setup
```typescript
// src/lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

export default logger
```

## Load & Stress Testing

- Use the bundled `npm run perf:load` script to execute baseline and stress phases (powered by `autocannon`).
- Configure `LOAD_TEST_BASE_URL`, `LOAD_TEST_CONNECTIONS`, `LOAD_TEST_DURATION`, `LOAD_TEST_COOKIE`, and `LOAD_TEST_AUTHORIZATION` as needed.
- Store the JSON output alongside release artifacts to track latency and throughput trends.
- Automate the command in CI (nightly) for regression detection.

## Backup Strategy

Define explicit recovery targets: **RPO ≤ 1 hour**, **RTO ≤ 30 minutes**. Verify that automated Supabase backups satisfy the RPO and rehearse full restores quarterly to keep the RTO realistic.

### Database Backups
```bash
# Daily database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/database/
rm $BACKUP_FILE
```

### Media Backup
```typescript
// Backup Supabase Storage
import { createClient } from '@supabase/supabase-js'

async function backupStorage() {
  const supabase = createClient(url, key)
  const { data: files } = await supabase.storage.from('uploads').list()
  
  for (const file of files) {
    const { data } = await supabase.storage
      .from('uploads')
      .download(file.name)
    
    // Upload to backup location
    await uploadToBackupStorage(data, file.name)
  }
}
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies implemented
- [ ] Security headers configured
- [ ] Error monitoring setup
- [ ] Performance monitoring enabled
- [ ] Backup strategy implemented
- [ ] Health checks configured
- [ ] Load testing completed
- [ ] SSL certificates configured
- [ ] CDN setup (if using custom domain)
- [ ] DNS records configured
- [ ] Monitoring alerts configured