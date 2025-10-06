# 🏋️ A1Lifter - Multisport Competition Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16-2D3748)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)

A modern, production-ready platform for managing multisport strength competitions including Powerlifting, Weightlifting, Strongman, CrossFit, and Streetlifting.

## ✨ Features

### Core Features
- 🏆 Multi-sport competition management
- 👥 Role-based access control (Admin, Organizer, Judge, Athlete)
- 📝 Online registration system with approval workflow
- ⚖️ Live judging with real-time scoring
- 📊 Live leaderboards and results tracking
- 📱 Responsive design (mobile, tablet, desktop)
- 🔐 Secure authentication with NextAuth
- 🗄️ PostgreSQL database with Prisma ORM
- 🚀 Deployed on Vercel with Supabase backend

### 🎯 Milestone 5: Advanced Features (NEW!)
- 🎥 **Video Upload** - Upload videos or add URLs for attempt recordings
- 📡 **Live Streaming** - Embed YouTube, Twitch, Vimeo streams for events
- 📈 **Advanced Analytics** - Interactive charts with Chart.js (line, bar, doughnut)
- 🌐 **Internationalization** - Multi-language support (en, it, es, fr, de)
- 📧 **Email Notifications** - Automated emails for registrations, attempts, and results

> See [MILESTONE_5_IMPLEMENTATION.md](MILESTONE_5_IMPLEMENTATION.md) for detailed documentation.

## 🚀 Quick Start

```bash
cd a1lifter-nextjs
npm install
npm run db:setup    # Push schema + seed database
npm run dev         # Start development server
```

**Login**: `admin@a1lifter.com` / `Admin123!`

📖 **Full setup guide**: See [a1lifter-nextjs/SETUP.md](./a1lifter-nextjs/SETUP.md)

## 📦 Tech Stack

- **Next.js 15** + **TypeScript** + **Tailwind CSS**
- **Prisma** + **Supabase** (PostgreSQL)
- **NextAuth** for authentication
- **React Query** for data fetching
- **Shadcn/ui** + **Radix UI** components

## 📚 Documentation

- [Setup Guide](./a1lifter-nextjs/SETUP.md) - Local development setup
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md) - Deploy to production
- [Supabase Migration](./SUPABASE_MIGRATION.md) - Database migration guide
- [Production Readiness](./PRODUCTION_READINESS.md) - Production checklist

## 📋 Project Status

✅ **Production Ready** - All core features implemented and tested

- ✅ Database schema designed and migrated to Supabase
- ✅ Authentication and authorization with NextAuth
- ✅ Core API endpoints implemented
- ✅ Admin dashboard with statistics
- ✅ User management system
- ✅ Event creation and management
- ✅ Registration system
- ✅ Live judging interface
- ✅ Results and records tracking
- ✅ Real-time updates
- ✅ Responsive UI
- ✅ Production deployment configuration

## 🎯 Next Steps

1. **Get Started**: Follow [SETUP.md](./a1lifter-nextjs/SETUP.md)
2. **Deploy**: See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
3. **Customize**: Update branding and configuration
4. **Launch**: Start managing your competitions! 🚀

---

Made with ❤️ for the strength sports community
