# Milestone 5: Advanced Features - Implementation Guide

This document describes the implementation of Milestone 5 features for A1Lifter.

## Overview

Milestone 5 adds the following advanced features:
1. ✅ Video Upload for Attempts
2. ✅ Live Streaming Integration
3. ✅ Advanced Analytics Charts (Chart.js)
4. ✅ Internationalization (i18n)
5. ✅ Email Notifications

---

## 1. Video Upload for Attempts

### Features
- Upload video files for attempt records
- Support for video URLs (YouTube, Vimeo, etc.)
- Video preview in UI
- File size validation (max 100MB)
- Video format validation

### Components
- **VideoUpload Component**: `src/components/attempts/VideoUpload.tsx`
  - Handles file upload and URL submission
  - Displays video preview
  - Integrated with attempt API

### API
- **POST** `/api/attempts/upload-video` - Upload video file
- **PATCH** `/api/attempts/[id]` - Update attempt with video URL

### Usage Example
```tsx
import { VideoUpload } from "@/components/attempts/VideoUpload"

<VideoUpload
  attemptId="attempt-id"
  currentVideoUrl={attempt.videoUrl}
  onUploadSuccess={(url) => console.log("Uploaded:", url)}
/>
```

### Storage Integration
The current implementation provides a placeholder for video storage. For production, integrate with:
- **Supabase Storage** (recommended for this project)
- AWS S3
- Cloudinary
- Uploadthing

Example Supabase Storage implementation is documented in the upload API route.

---

## 2. Live Streaming Integration

### Features
- Embed live streams from multiple platforms
- Support for YouTube, Twitch, Vimeo
- Generate embeddable stream code
- Copy share links
- Stream URL management per event

### Components
- **LiveStreaming Component**: `src/components/live/LiveStreaming.tsx`
  - Multi-tab interface (Viewer, Embed, Settings)
  - Platform-specific embed code generation
  - Live badge indicator

### Database
Added `streamUrl` field to Event model in `prisma/schema.prisma`

### Usage Example
```tsx
import { LiveStreaming } from "@/components/live/LiveStreaming"

<LiveStreaming
  eventId={event.id}
  eventName={event.name}
  streamUrl={event.streamUrl}
  isLive={event.status === "IN_PROGRESS"}
/>
```

### Supported Platforms
- YouTube Live
- Twitch
- Vimeo
- Direct HLS/DASH streams

---

## 3. Advanced Analytics Charts

### Features
- Interactive charts using Chart.js
- Multiple chart types: Line, Bar, Doughnut
- Performance tracking over time
- Category distribution visualization
- Attempt results breakdown

### Components
- **AnalyticsCharts Component**: `src/components/analytics/AnalyticsCharts.tsx`
  - Tab-based interface for different chart views
  - Responsive design
  - Customizable data props

### Dependencies
```json
{
  "chart.js": "^4.x",
  "react-chartjs-2": "^5.x"
}
```

### Usage Example
```tsx
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts"

<AnalyticsCharts
  data={{
    performanceData: {
      labels: ["Jan", "Feb", "Mar"],
      datasets: [{
        label: "Total Lifts",
        data: [65, 78, 90],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)"
      }]
    },
    categoryDistribution: {
      labels: ["Powerlifting", "Weightlifting"],
      data: [40, 35]
    },
    attemptResults: {
      labels: ["Good", "No Lift"],
      data: [120, 30]
    }
  }}
/>
```

### Integration
The component is already integrated into `/analytics` page.

---

## 4. Internationalization (i18n)

### Features
- Multi-language support
- Language detection
- Translation files for 5 languages (en, it, es, fr, de)
- Type-safe translation keys

### Implementation
- **Library**: next-intl
- **Configuration**: `src/i18n.ts`
- **Translations**: `messages/` directory
- **Hook**: `src/hooks/use-translations.ts`

### Supported Languages
1. English (en) - Complete
2. Italian (it) - Complete
3. Spanish (es) - Placeholder
4. French (fr) - Placeholder
5. German (de) - Placeholder

### Usage Example
```tsx
import { useTranslations } from "@/hooks/use-translations"

function MyComponent() {
  const t = useTranslations('common')
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button>{t('submit')}</button>
    </div>
  )
}
```

### Translation Structure
```json
{
  "common": { "appName", "welcome", "login", ... },
  "nav": { "dashboard", "events", ... },
  "dashboard": { "title", "totalAthletes", ... },
  "events": { ... },
  "athletes": { ... },
  "attempts": { ... },
  "judge": { ... },
  "live": { ... },
  "analytics": { ... },
  "notifications": { ... },
  "email": { ... }
}
```

### Adding New Translations
1. Add key to `messages/en.json`
2. Translate to other languages
3. Use in components with `useTranslations` hook

---

## 5. Email Notifications

### Features
- Automated email notifications for key events
- HTML email templates
- Multiple email providers support
- Fallback to console logging in development

### Email Types
1. **Registration Approved** - Sent when athlete registration is approved
2. **Registration Rejected** - Sent when registration is declined
3. **Attempt Upcoming** - Reminder before athlete's turn
4. **Result Posted** - Notification after attempt is judged
5. **Event Update** - Important event announcements
6. **Welcome Email** - Sent to new users

### Components
- **Email Service**: `src/lib/email/mailer.ts`
- **Email Templates**: `src/lib/email/templates.ts`

### Configuration
Set up email in `.env.local` (see `.env.example`):

```env
# For Gmail
EMAIL_PROVIDER="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="noreply@a1lifter.com"

# For SendGrid
EMAIL_PROVIDER="sendgrid"
SENDGRID_API_KEY="your-api-key"

# For Custom SMTP
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user"
SMTP_PASSWORD="pass"
```

### Usage Example
```tsx
import {
  sendRegistrationApprovedEmail,
  sendAttemptUpcomingEmail,
  sendResultPostedEmail
} from "@/lib/email/templates"

// Send registration approval
await sendRegistrationApprovedEmail(
  athlete.email,
  {
    athleteName: athlete.name,
    eventName: event.name,
    eventDate: event.startDate,
    eventLocation: event.location
  }
)

// Send attempt reminder
await sendAttemptUpcomingEmail(
  athlete.email,
  {
    athleteName: athlete.name,
    eventName: event.name,
    lift: "SQUAT",
    attemptNumber: 2,
    weight: 150,
    estimatedTime: "10:30 AM"
  }
)

// Send result notification
await sendResultPostedEmail(
  athlete.email,
  {
    athleteName: athlete.name,
    eventName: event.name,
    lift: "SQUAT",
    attemptNumber: 2,
    weight: 150,
    result: "GOOD"
  }
)
```

### Email Templates
All email templates use a consistent HTML layout with:
- Gradient header with A1Lifter branding
- Responsive design
- Call-to-action buttons
- Footer with branding

### Development Mode
In development (without email config), emails are logged to console:
```
📧 Email would be sent:
To: athlete@example.com
Subject: Registration Approved - Competition Name
Content: [HTML content]
```

---

## Testing

### Unit Tests
Create tests for new components:

```bash
npm run test
```

### E2E Tests
Test user workflows with Playwright:

```bash
npm run e2e
```

### Manual Testing Checklist
- [ ] Upload video to attempt
- [ ] Add YouTube stream URL to event
- [ ] View analytics charts
- [ ] Switch languages (when properly configured)
- [ ] Send test email notifications

---

## Deployment Considerations

### 1. Video Storage
- Set up Supabase Storage bucket for videos
- Configure storage permissions
- Update upload API to use real storage

### 2. Email Service
- Choose email provider (Gmail, SendGrid, AWS SES)
- Configure SMTP credentials
- Set up email templates customization
- Test email deliverability

### 3. Live Streaming
- Ensure CSP headers allow iframe embeds
- Test with actual live streams
- Consider bandwidth for video streaming

### 4. Analytics
- Consider data aggregation for large datasets
- Implement caching for chart data
- Add more chart types as needed

### 5. Internationalization
- Complete translations for all languages
- Add language switcher to UI
- Test RTL languages if needed

---

## Environment Variables

Required environment variables (add to `.env.local`):

```env
# Email (choose one provider)
EMAIL_PROVIDER="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="noreply@a1lifter.com"

# Application URL
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Optional: Sentry for error tracking
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
```

---

## Migration Guide

### Database Migration
Run Prisma migration to add `streamUrl` to events:

```bash
npx prisma migrate dev --name add_stream_url
```

Or push schema directly:

```bash
npx prisma db push
```

### Dependency Installation
All dependencies have been installed:
- next-intl (i18n)
- chart.js + react-chartjs-2 (charts)
- nodemailer (emails)

---

## Future Enhancements

### Video Upload
- Implement video transcoding
- Add video thumbnails
- Support video playlists
- Add video player with custom controls

### Live Streaming
- WebRTC for low-latency streaming
- Multi-camera support
- Chat integration
- Stream recording

### Analytics
- Real-time analytics dashboard
- Export charts as images
- Custom date range filters
- Comparison views

### Internationalization
- Auto-detect user language
- User preference saving
- Complete all language translations
- Add more languages

### Email Notifications
- Email scheduling
- User email preferences
- Rich text email editor
- Email analytics/tracking

---

## Support

For questions or issues:
1. Check this documentation
2. Review component source code
3. Check API route implementations
4. Create an issue in the repository

---

## License

This implementation is part of the A1Lifter project and follows the project's license.
