// Re-export Prisma types (will be available after prisma generate)
// export type {
//   User,
//   UserRole,
//   Sport,
//   Discipline,
//   ScoringType,
//   Event,
//   EventStatus,
//   Session,
//   SessionStatus,
//   AthleteProfile,
//   Gender,
//   Category,
//   Registration,
//   RegistrationStatus,
//   JudgeAssignment,
//   Attempt,
//   AttemptResult,
//   CompetitionResult,
// } from '@prisma/client'

// Basic types (will be replaced with Prisma generated types)
export type UserRole = 'ATHLETE' | 'JUDGE' | 'HEAD_JUDGE' | 'ORGANIZER' | 'SCORER' | 'VOLUNTEER' | 'VIEWER'
export type EventStatus = 'DRAFT' | 'OPEN' | 'REGISTRATION_CLOSED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type AttemptResult = 'GOOD' | 'NO_LIFT' | 'PENDING'

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  name: string
  description?: string
  sportId: string
  organizerId: string
  startDate: Date
  endDate: Date
  location: string
  status: EventStatus
  isPublic: boolean
  maxAthletes?: number
  registrationFee?: number
  createdAt: Date
  updatedAt: Date
}

// Composite types for API responses
export type EventWithDetails = Event & {
  sport: { id: string; name: string }
  organizer: Pick<User, 'id' | 'name' | 'email'>
  sessions: Array<{ id: string; name: string; startTime: Date }>
  registrations: Array<{ id: string; userId: string }>
  categories: Array<{ id: string; name: string }>
}

export type UserWithProfile = User & {
  profile: { 
    id: string
    firstName: string
    lastName: string
    gender: Gender
  } | null
}

export type AttemptWithDetails = {
  id: string
  userId: string
  weight?: number
  result: AttemptResult
  user: UserWithProfile
  discipline: { id: string; name: string }
  session: {
    id: string
    name: string
    event: Event
  }
}

export type RegistrationWithDetails = {
  id: string
  userId: string
  eventId: string
  status: string
  user: UserWithProfile
  event: EventWithDetails
  category: { id: string; name: string } | null
}

// Form types
export interface CreateEventForm {
  name: string
  description?: string
  sportId: string
  startDate: Date
  endDate: Date
  location: string
  maxAthletes?: number
  registrationFee?: number
  isPublic: boolean
}

export interface CreateAthleteProfileForm {
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: Gender
  bodyWeight?: number
  federation?: string
  membershipId?: string
}

export interface JudgeDecision {
  judgeId: string
  decision: 'good' | 'no_lift'
  timestamp: Date
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Dashboard types
export interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalAthletes: number
  recentRegistrations: number
}

// Live competition types
export interface LiveUpdate {
  type: 'attempt' | 'session_status' | 'registration' | 'result'
  eventId: string
  sessionId?: string
  data: Record<string, unknown>
  timestamp: Date
}

// Performance monitoring
export interface PerformanceMetrics {
  pageLoadTime: number
  timeToInteractive: number
  cumulativeLayoutShift: number
  firstContentfulPaint: number
}