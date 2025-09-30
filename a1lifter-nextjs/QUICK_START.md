# A1Lifter - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (Supabase account recommended)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/g97iulio1609/A1Lifter.git
   cd A1Lifter/a1lifter-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Setup database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # (Optional) Seed test data
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

## 📚 Project Structure

```
a1lifter-nextjs/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── ui/            # UI components (Radix/Shadcn)
│   │   └── dashboard/     # Dashboard components
│   ├── hooks/             # Custom React hooks
│   │   └── api/          # API hooks with React Query
│   ├── lib/              # Utility libraries
│   │   ├── auth.ts       # NextAuth configuration
│   │   ├── db.ts         # Prisma client
│   │   └── supabase.ts   # Supabase client
│   ├── types/            # TypeScript types
│   └── __tests__/        # Test files
├── prisma/
│   └── schema.prisma     # Database schema
├── scripts/              # Utility scripts
│   ├── migrate-firebase-to-supabase.ts
│   └── setup-rls-policies.sql
└── public/               # Static assets
```

## 🔑 Key Features

### For Athletes
- Register for competitions
- View live results
- Track personal records
- Manage profile

### For Organizers
- Create and manage events
- Manage registrations
- Configure categories
- Export results

### For Judges
- Live judging interface
- Score attempts
- View assigned events

### For Public
- View live competitions
- Access leaderboards
- Follow athletes
- View records

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npx prisma studio       # Open Prisma Studio
npx prisma migrate dev  # Create migration
npx prisma db push      # Push schema changes
npx prisma generate     # Generate Prisma Client

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run type-check      # Check TypeScript types
```

## 🔐 Authentication

The app uses NextAuth.js with support for:
- Email/Password (Credentials)
- Google OAuth
- GitHub OAuth (optional)

### User Roles
- **ADMIN**: Full system access
- **ORGANIZER**: Create and manage events
- **JUDGE**: Score attempts
- **ATHLETE**: Register and compete

## 📊 Database Schema

### Core Models
- **User**: Authentication and profiles
- **Event**: Competitions
- **Category**: Weight classes and divisions
- **Registration**: Athlete event signups
- **Attempt**: Individual lifts
- **Record**: Competition and personal records
- **Notification**: Real-time updates

See `prisma/schema.prisma` for complete schema.

## 🌐 API Routes

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/ready` - Readiness probe
- `GET /api/events` - List public events

### Protected Endpoints
- `POST /api/events` - Create event (Organizer)
- `PATCH /api/events/[id]` - Update event
- `POST /api/registrations` - Register for event
- `POST /api/attempts` - Submit attempt (Judge)

## 🧪 Testing

### Run Tests
```bash
# All tests
npm run test

# Specific file
npm run test database.test.ts

# With coverage
npm run test:coverage
```

### Test Database
Tests use a separate test database to avoid polluting development data.

Configure `DATABASE_URL` for test environment:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/a1lifter_test"
```

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Add all variables from `.env.example` in Vercel dashboard
   - Ensure `DATABASE_URL` points to production Supabase

### Deploy with Docker

```bash
# Build image
docker build -t a1lifter .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  a1lifter
```

## 🔍 Monitoring

### Health Checks
```bash
# Application health
curl https://your-domain.com/api/health

# Database readiness
curl https://your-domain.com/api/ready
```

### Logs
```bash
# Development logs
npm run dev

# Production logs (Vercel)
vercel logs
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Reset database
npx prisma migrate reset
```

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Type Errors
```bash
# Regenerate Prisma client
npx prisma generate

# Check types
npm run type-check
```

## 📖 Additional Documentation

- [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md) - Migration guide
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Deployment guide
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) - Readiness checklist

## 🤝 Contributing

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Support

For issues and questions:
- Create an [Issue](https://github.com/g97iulio1609/A1Lifter/issues)
- Contact: giulio.leone@example.com

---

**Happy Lifting! 🏋️‍♂️**
