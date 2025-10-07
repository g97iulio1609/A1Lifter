import { z } from "zod"

/**
 * Schema validations for Attempt-related operations
 */

// Enums
export const LiftTypeSchema = z.enum(["SNATCH", "CLEAN_AND_JERK"])
export const AttemptResultSchema = z.enum(["PENDING", "GOOD", "NO_LIFT", "DISQUALIFIED"])
export const AttemptStatusSchema = z.enum(["QUEUED", "IN_PROGRESS", "COMPLETED"])

// Create Attempt Schema
export const CreateAttemptSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  categoryId: z.string().min(1, "Category ID is required"),
  registrationId: z.string().min(1, "Registration ID is required"),
  lift: LiftTypeSchema,
  attemptNumber: z.number().int().min(1).max(3, "Attempt number must be 1-3"),
  weight: z.number().positive("Weight must be positive"),
  notes: z.string().optional(),
  videoUrl: z.string().url().optional(),
})

// Update Attempt Schema
export const UpdateAttemptSchema = z.object({
  result: AttemptResultSchema.optional(),
  weight: z.number().positive("Weight must be positive").optional(),
  notes: z.string().optional(),
  judgeScores: z
    .object({
      judge1: z.boolean().optional(),
      judge2: z.boolean().optional(),
      judge3: z.boolean().optional(),
      headJudge: z.boolean().optional(),
    })
    .optional(),
  videoUrl: z.string().url().optional(),
})

// Judge Attempt Schema (for judges to record results)
export const JudgeAttemptSchema = z.object({
  result: AttemptResultSchema.refine(
    (val) => val !== "PENDING",
    "Result must be GOOD, NO_LIFT, or DISQUALIFIED"
  ),
  notes: z.string().optional(),
  judgeScores: z
    .object({
      judge1: z.boolean().optional(),
      judge2: z.boolean().optional(),
      judge3: z.boolean().optional(),
      headJudge: z.boolean().optional(),
    })
    .optional(),
  videoUrl: z.string().url().optional(),
})

// Query Params Schema
export const AttemptQuerySchema = z.object({
  eventId: z.string().optional(),
  userId: z.string().optional(),
  categoryId: z.string().optional(),
  lift: LiftTypeSchema.optional(),
  result: AttemptResultSchema.optional(),
  status: AttemptStatusSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
})

// Type exports
export type CreateAttemptInput = z.infer<typeof CreateAttemptSchema>
export type UpdateAttemptInput = z.infer<typeof UpdateAttemptSchema>
export type JudgeAttemptInput = z.infer<typeof JudgeAttemptSchema>
export type AttemptQuery = z.infer<typeof AttemptQuerySchema>
