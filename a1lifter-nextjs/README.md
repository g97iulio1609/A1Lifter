# A1Lifter - Next.js 15 Platform

Modern sports competition management platform built with Next.js 15, Supabase, and Prisma.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with Turbopack
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + Custom Components
- **Type Safety**: TypeScript
- **Testing**: Vitest + React Testing Library
- **PWA**: Service Worker + Offline Support

## 📋 Features

### Core Platform
- ✅ Next.js 15 setup with Turbopack
- ✅ TypeScript configuration
- ✅ Tailwind CSS v4 integration
- ✅ Performance optimizations (bundle analysis, code splitting)
- ✅ Security headers and CSP
- ✅ PWA manifest for offline support

### Database & Backend
- ✅ Supabase integration with SSR support
- ✅ Prisma schema for sports management
- ✅ Type-safe database operations
- ✅ Authentication middleware
- ✅ Optimized data models for multi-sport support

### UI/UX
- ✅ Modern design system with Radix UI
- ✅ Responsive dashboard layout
- ✅ Performance-optimized components
- ✅ Accessibility features built-in

### Testing & Quality
- ✅ Vitest testing framework
- ✅ Component testing setup
- ✅ ESLint configuration
- ✅ TypeScript strict mode

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   └── ui/             # Base UI components (Button, Card, etc.)
├── lib/                # Utilities and configurations
│   ├── supabase/       # Supabase client setup
│   ├── prisma.ts       # Prisma client
│   └── utils.ts        # Helper functions
├── types/              # TypeScript type definitions
└── test/               # Test utilities and setup
```

### Database Schema

The Prisma schema supports:
- **Multi-sport competitions** (Powerlifting, Weightlifting, Strongman, CrossFit, Streetlifting)
- **Role-based access control** (Athletes, Judges, Organizers, etc.)
- **Event management** with sessions and categories
- **Real-time scoring** and attempt tracking
- **Performance analytics** and records

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- PostgreSQL database

### Installation

1. **Clone and install dependencies**:
```bash
cd a1lifter-nextjs
npm install
```

2. **Environment setup**:
```bash
cp .env.example .env.local
# Fill in your Supabase credentials
```

3. **Database setup**:
```bash
# Initialize Prisma (when database is available)
npx prisma generate
npx prisma db push
```

4. **Run development server**:
```bash
npm run dev
```

## 📊 Performance Targets

Based on the epic requirements, this platform targets:

- **Lighthouse Mobile Score**: ≥95
- **Core Web Vitals**:
  - LCP ≤ 2.5s
  - CLS ≤ 0.1
  - INP ≤ 200ms
  - TTFB ≤ 0.8s
- **Bundle Sizes**:
  - JS ≤ 170KB gzipped (initial route)
  - CSS ≤ 50KB gzipped
  - Optimal code splitting

## 🧪 Testing

```bash
# Unit tests
npm run test

# Test with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Bundle analysis
npm run analyze

# Start production server
npm start
```

## 🔧 Configuration

### Performance Optimizations
- Route-level code splitting
- Image optimization with AVIF/WebP
- Turbopack for faster builds
- Bundle size monitoring
- PWA service worker

### Security Features
- CSP headers
- CSRF protection
- XSS prevention
- Secure authentication flow

## 📚 Documentation

- [Prisma Schema](./prisma/schema.prisma) - Database models
- [API Routes](./src/app/api/) - Backend endpoints
- [Component Library](./src/components/ui/) - UI components
- [Types](./src/types/) - TypeScript definitions

## 🚧 Roadmap

- [ ] Supabase database deployment
- [ ] Real-time subscriptions for live updates
- [ ] Advanced caching strategies
- [ ] Mobile app with React Native
- [ ] Analytics dashboard
- [ ] Multi-language support

## 🤝 Contributing

This platform follows the clean architecture principles and uses modern development practices. All contributions should maintain type safety, test coverage, and performance standards.
