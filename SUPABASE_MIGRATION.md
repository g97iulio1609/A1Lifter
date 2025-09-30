# A1Lifter Supabase Migration Guide

This document outlines the migration plan from Firebase to Supabase, addressing GitHub issues #2-6.

## Issue #3: Design and Migrate Schema to Supabase

### Current Firebase Firestore Collections
```
/users/{userId}
/events/{eventId}
  /categories/{categoryId}
  /sessions/{sessionId}
  /registrations/{registrationId}
  /attempts/{attemptId}
/judges/{judgeId}
/results/{resultId}
```

### New Supabase Schema (Implemented in Prisma)
Our Prisma schema defines a comprehensive database structure that includes:

1. **Authentication Tables** (NextAuth compatible)
   - users
   - accounts  
   - user_sessions
   - verificationtokens

2. **Core Domain Tables**
   - events
   - categories
   - event_sessions
   - registrations
   - attempts
   - judge_assignments
   - records

### Migration Steps

1. **Export Firebase Data**
```bash
# Export existing Firestore data
firebase firestore:export gs://your-bucket/firestore-export
```

2. **Set up Supabase Database**
```sql
-- Run Prisma migrations to create tables
npx prisma migrate dev --name init
```

3. **Data Transformation Script**
```typescript
// scripts/migrate-firebase-to-supabase.ts
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../src/lib/db';

async function migrateData() {
  // 1. Migrate Users
  const usersSnapshot = await firestore.collection('users').get();
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    await prisma.user.create({
      data: {
        id: doc.id,
        email: userData.email,
        name: userData.name || userData.displayName,
        role: userData.role || 'ATHLETE',
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
      }
    });
  }

  // 2. Migrate Events
  const eventsSnapshot = await firestore.collection('events').get();
  for (const doc of eventsSnapshot.docs) {
    const eventData = doc.data();
    await prisma.event.create({
      data: {
        id: doc.id,
        name: eventData.name,
        description: eventData.description,
        sport: eventData.sport,
        status: eventData.status,
        startDate: eventData.startDate.toDate(),
        endDate: eventData.endDate.toDate(),
        location: eventData.location,
        organizerId: eventData.organizerId,
        maxAthletes: eventData.maxAthletes,
        createdAt: eventData.createdAt?.toDate() || new Date(),
        updatedAt: eventData.updatedAt?.toDate() || new Date(),
      }
    });
  }

  // 3. Migrate other collections...
}
```

## Issue #4: Set up Authentication and Security on Supabase

### Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Event organizers can manage their events
CREATE POLICY "Organizers can manage their events" ON events
  FOR ALL USING (auth.uid()::text = organizer_id);

-- Public can view published events
CREATE POLICY "Public can view published events" ON events
  FOR SELECT USING (status IN ('REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED'));

-- Athletes can view their registrations
CREATE POLICY "Athletes can view own registrations" ON registrations
  FOR SELECT USING (auth.uid()::text = user_id);

-- Athletes can register for events
CREATE POLICY "Athletes can register for events" ON registrations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Judges can view attempts for their assigned events
CREATE POLICY "Judges can view assigned attempts" ON attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM judge_assignments 
      WHERE user_id = auth.uid()::text 
      AND event_id = attempts.event_id
    )
  );
```

### Environment Variables Setup
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database URL for Prisma
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

## Issue #5: Implement DB Connectivity in Next.js

### Supabase Client Setup (Already Implemented)
- ✅ Client-side Supabase client for browser operations
- ✅ Server-side Supabase client with cookie handling for SSR
- ✅ Integration with NextAuth for authentication

### API Routes Structure
```
/api
├── auth/
│   └── [...nextauth]/
├── events/
│   ├── route.ts (GET, POST)
│   └── [id]/
│       └── route.ts (GET, PATCH, DELETE)
├── athletes/
├── registrations/
└── attempts/
```

### Database Queries with Prisma
```typescript
// Example: Get events with full relations
export async function getEventsWithRelations() {
  return await prisma.event.findMany({
    include: {
      organizer: true,
      categories: true,
      registrations: {
        include: {
          user: true,
          attempts: true,
        }
      },
      sessions: true,
    },
    orderBy: {
      startDate: 'desc'
    }
  });
}
```

## Issue #6: Test DB Operations with Supabase

### Testing Strategy
1. **Unit Tests** - Test individual database operations
2. **Integration Tests** - Test API routes with database
3. **E2E Tests** - Test complete user workflows

### Test Database Setup
```typescript
// tests/setup.ts
import { execSync } from 'child_process';

beforeAll(async () => {
  // Reset test database
  execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
  
  // Seed test data
  await prisma.user.createMany({
    data: [
      { id: 'user1', email: 'admin@test.com', name: 'Admin User', role: 'ADMIN' },
      { id: 'user2', email: 'athlete@test.com', name: 'Test Athlete', role: 'ATHLETE' }
    ]
  });
});
```

### Example Tests
```typescript
// tests/api/events.test.ts
describe('/api/events', () => {
  it('should create a new event', async () => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Competition',
        sport: 'POWERLIFTING',
        startDate: '2024-06-01',
        endDate: '2024-06-02',
        location: 'Test Gym'
      })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Test Competition');
  });

  it('should fetch events for authenticated user', async () => {
    const response = await fetch('/api/events');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## Migration Checklist

- [x] Design comprehensive Prisma schema
- [x] Set up Supabase client configuration
- [x] Implement NextAuth with Supabase integration
- [x] Create API routes structure
- [x] Set up React Query hooks for data fetching
- [ ] Deploy Supabase instance and configure production environment
- [ ] Create migration scripts for data transfer
- [ ] Set up RLS policies for security
- [ ] Implement comprehensive test suite
- [ ] Performance testing and optimization
- [ ] Documentation and training for team

## Benefits of Migration

1. **Unified Database**: Single PostgreSQL database vs Firebase's document model
2. **Type Safety**: Full TypeScript support with Prisma
3. **Better Relations**: Proper foreign keys and joins
4. **Cost Efficiency**: More predictable pricing model
5. **SQL Flexibility**: Complex queries and reporting capabilities
6. **Real-time Features**: Built-in subscriptions and websockets
7. **Better Development Experience**: Local development with Docker