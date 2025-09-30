// Placeholder types until Prisma client is generated
export type UserWithRelations = {
  id: string
  email: string
  name?: string
  role: string
  accounts: any[]
  sessions: any[]
  organizedEvents: any[]
  registrations: any[]
  attempts: any[]
  judgeAssignments: any[]
}

export type EventWithRelations = {
  id: string
  name: string
  description?: string
  sport: string
  status: string
  startDate: Date
  endDate: Date
  location: string
  organizer: any
  categories: any[]
  sessions: any[]
  registrations: any[]
  attempts: any[]
  records: any[]
}

export type RegistrationWithRelations = {
  id: string
  userId: string
  eventId: string
  categoryId: string
  status: string
  user: any
  event: any
  category: any
  attempts: any[]
}

export type AttemptWithRelations = {
  id: string
  userId: string
  eventId: string
  categoryId: string
  registrationId: string
  lift: string
  attemptNumber: number
  weight: number
  result: string
  user: any
  event: any
  category: any
  registration: any
}

// API Response types
export interface ApiResponse<T = any> {
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
  startDate: string
  endDate: string
  location: string
  maxAthletes?: number
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