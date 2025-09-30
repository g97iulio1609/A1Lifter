// Type-safe domain types (will be replaced by Prisma generated types after db:push)

export interface BaseUser {
  id: string
  email: string
  name: string | null
  role: string
}

export interface BaseEvent {
  id: string
  name: string
  description: string | null
  sport: string
  status: string
  startDate: Date
  endDate: Date
  location: string
}

export interface BaseCategory {
  id: string
  name: string
  gender: string
  minWeight: number | null
  maxWeight: number | null
}

export interface BaseAttempt {
  id: string
  userId: string
  eventId: string
  lift: string
  attemptNumber: number
  weight: number
  result: string
  createdAt: Date
  updatedAt: Date
}

export type UserWithRelations = BaseUser & {
  accounts: unknown[]
  sessions: unknown[]
  organizedEvents: BaseEvent[]
  registrations: unknown[]
  attempts: BaseAttempt[]
  judgeAssignments: unknown[]
}

export type EventWithRelations = BaseEvent & {
  organizer: BaseUser
  categories: BaseCategory[]
  sessions: unknown[]
  registrations: unknown[]
  attempts: BaseAttempt[]
  records: unknown[]
}

export type RegistrationWithRelations = {
  id: string
  userId: string
  eventId: string
  categoryId: string
  status: string
  user: BaseUser
  event: BaseEvent
  category: BaseCategory
  attempts: BaseAttempt[]
}

export type AttemptWithRelations = BaseAttempt & {
  user: BaseUser
  event: BaseEvent
  category: BaseCategory
  registration: {
    id: string
    userId: string
    eventId: string
  }
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
}

export interface EventFormData {
  name: string
  description?: string
  sport: string
  status?: string
  startDate: string
  endDate: string
  location: string
  maxAthletes?: number
  organizerId?: string
}

export interface CategoryFormData {
  name: string
  gender: string
  minWeight?: number
  maxWeight?: number
  ageMin?: number
  ageMax?: number
}

export interface AttemptFormData {
  weight: number
  lift: string
  attemptNumber: number
}