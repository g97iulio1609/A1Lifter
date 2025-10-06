/**
 * Attempt Service - Business logic for attempt operations
 */

import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import type {
  CreateAttemptInput,
  UpdateAttemptInput,
  AttemptQuery,
  JudgeAttemptInput,
} from "@/lib/validations/attempts"

const LOCK_TTL_MS = 60_000 // 1 minute stale lock window

const attemptInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  event: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      gender: true,
      minWeight: true,
      maxWeight: true,
    },
  },
  registration: {
    select: {
      id: true,
      lot: true,
      platform: true,
      bodyWeight: true,
    },
  },
  lockedByUser: {
    select: {
      id: true,
      name: true,
    },
  },
  judgedByUser: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.AttemptInclude

type AttemptWithRelations = Prisma.AttemptGetPayload<{ include: typeof attemptInclude }>

function getStaleLockDate(now: Date) {
  return new Date(now.getTime() - LOCK_TTL_MS)
}

async function releaseStaleLocks(eventId: string) {
  const now = new Date()
  const staleAt = getStaleLockDate(now)

  await prisma.attempt.updateMany({
    where: {
      eventId,
      status: "IN_PROGRESS",
      lockedAt: {
        lt: staleAt,
      },
      result: "PENDING",
    },
    data: {
      status: "QUEUED",
      lockedAt: null,
      lockedBy: null,
    },
  })
}

export class AttemptService {
  /**
   * Get attempts with optional filters
   */
  static async getAttempts(query: AttemptQuery) {
    const { eventId, userId, categoryId, lift, result, status, limit = 50, offset = 0 } = query

    const where: Prisma.AttemptWhereInput = {
      ...(eventId && { eventId }),
      ...(userId && { userId }),
      ...(categoryId && { categoryId }),
      ...(lift && { lift }),
      ...(result && { result }),
      ...(status && { status }),
    }

    const [attempts, total] = await Promise.all([
      prisma.attempt.findMany({
        where,
        include: attemptInclude,
        orderBy: [
          { timestamp: "asc" },
          { attemptNumber: "asc" },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.attempt.count({ where }),
    ])

    return {
      attempts,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    }
  }

  /**
   * Get single attempt by ID
   */
  static async getAttemptById(id: string) {
    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: attemptInclude,
    })

    if (!attempt) {
      throw new Error("Attempt not found")
    }

    return attempt
  }

  /**
   * Create new attempt
   */
  static async createAttempt(data: CreateAttemptInput) {
    // Check if attempt already exists
    const existing = await prisma.attempt.findUnique({
      where: {
        userId_eventId_lift_attemptNumber: {
          userId: data.userId,
          eventId: data.eventId,
          lift: data.lift,
          attemptNumber: data.attemptNumber,
        },
      },
    })

    if (existing) {
      throw new Error("Attempt with this number already exists for this user and lift")
    }

    // Verify registration exists and is approved
    const registration = await prisma.registration.findUnique({
      where: { id: data.registrationId },
    })

    if (!registration) {
      throw new Error("Registration not found")
    }

    if (registration.status !== "APPROVED") {
      throw new Error("Registration must be approved before creating attempts")
    }

    // Verify event is in progress
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
    })

    if (!event) {
      throw new Error("Event not found")
    }

    if (event.status !== "IN_PROGRESS" && event.status !== "REGISTRATION_OPEN") {
      throw new Error("Attempts can only be created for events that are in progress")
    }

    // Create attempt
    const attempt = await prisma.attempt.create({
      data: {
        ...data,
        result: "PENDING",
        status: "QUEUED",
        timestamp: new Date(),
      },
      include: attemptInclude,
    })

    return attempt
  }

  /**
   * Update attempt (for judges)
   */
  static async updateAttempt(id: string, data: UpdateAttemptInput | JudgeAttemptInput, judgedBy?: string) {
    const attempt = await prisma.attempt.findUnique({
      where: { id },
    })

    if (!attempt) {
      throw new Error("Attempt not found")
    }

    if (attempt.result !== "PENDING" && data.result) {
      throw new Error("Cannot change result of already judged attempt")
    }

    if (
      (data as JudgeAttemptInput).result &&
      attempt.status === "IN_PROGRESS" &&
      attempt.lockedBy &&
      judgedBy &&
      attempt.lockedBy !== judgedBy
    ) {
      throw new Error("Attempt is locked by another judge")
    }

    const updated = await prisma.attempt.update({
      where: { id },
      data: {
        ...data,
        ...(data as JudgeAttemptInput).result && {
          judgedAt: new Date(),
          judgedBy,
          status: "COMPLETED",
          lockedAt: null,
          lockedBy: null,
        },
      },
      include: attemptInclude,
    })

    // Create notification for athlete
    if ((data as JudgeAttemptInput).result && (data as JudgeAttemptInput).result !== "PENDING") {
      await prisma.notification.create({
        data: {
          userId: attempt.userId,
          type: "RESULT_POSTED",
          title: "Attempt Result",
          message: `Your ${attempt.lift} attempt #${attempt.attemptNumber} was judged: ${(data as JudgeAttemptInput).result}`,
          data: {
            attemptId: id,
            result: (data as JudgeAttemptInput).result,
            weight: attempt.weight,
          },
        },
      }).catch(err => {
        console.error("Failed to create notification:", err)
        // Don't fail the update if notification creation fails
      })
    }

    return updated
  }

  /**
   * Delete attempt (only if pending)
   */
  static async deleteAttempt(id: string) {
    const attempt = await prisma.attempt.findUnique({
      where: { id },
    })

    if (!attempt) {
      throw new Error("Attempt not found")
    }

    if (attempt.result !== "PENDING" || attempt.status === "IN_PROGRESS") {
      throw new Error("Cannot delete judged attempts")
    }

    await prisma.attempt.delete({
      where: { id },
    })

    return { success: true }
  }

  /**
   * Get current pending attempt for an event (for live judging)
   */
  static async getCurrentAttempt(eventId: string, judgeId?: string) {
    await releaseStaleLocks(eventId)

    const include = attemptInclude

    if (judgeId) {
      const judgeAttempt = await prisma.attempt.findFirst({
        where: {
          eventId,
          result: "PENDING",
          status: "IN_PROGRESS",
          lockedBy: judgeId,
        },
        include,
        orderBy: {
          lockedAt: "asc",
        },
      })

      if (judgeAttempt) {
        return judgeAttempt
      }
    }

    const inProgress = await prisma.attempt.findFirst({
      where: {
        eventId,
        result: "PENDING",
        status: "IN_PROGRESS",
      },
      include,
      orderBy: {
        lockedAt: "asc",
      },
    })

    if (inProgress) {
      return inProgress
    }

    return prisma.attempt.findFirst({
      where: {
        eventId,
        result: "PENDING",
        status: "QUEUED",
      },
      include,
      orderBy: [
        { timestamp: "asc" },
        { attemptNumber: "asc" },
      ],
    })
  }

  /**
   * Get athlete's attempts for an event
   */
  static async getAthleteAttempts(eventId: string, userId: string) {
    const attempts = await prisma.attempt.findMany({
      where: {
        eventId,
        userId,
      },
      include: {
        category: true,
        lockedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { lift: "asc" },
        { attemptNumber: "asc" },
      ],
    })

    // Calculate best lifts
    const snatchAttempts = attempts.filter(a => a.lift === "SNATCH")
    const cleanJerkAttempts = attempts.filter(a => a.lift === "CLEAN_AND_JERK")

    const bestSnatch = snatchAttempts
      .filter(a => a.result === "GOOD")
      .reduce((max, a) => (a.weight > max ? a.weight : max), 0)

    const bestCleanJerk = cleanJerkAttempts
      .filter(a => a.result === "GOOD")
      .reduce((max, a) => (a.weight > max ? a.weight : max), 0)

    const total = bestSnatch + bestCleanJerk

    return {
      attempts,
      summary: {
        bestSnatch,
        bestCleanJerk,
        total,
        snatchAttempts: snatchAttempts.length,
        cleanJerkAttempts: cleanJerkAttempts.length,
      },
    }
  }

  /**
   * Claim next attempt for judging with optimistic locking
   */
  static async claimAttempt(
    eventId: string,
    judgeId: string,
    options: { autoClaimOnly?: boolean } = {}
  ): Promise<AttemptWithRelations | null> {
    await releaseStaleLocks(eventId)

    // Check if judge already has an attempt locked
    const existing = await prisma.attempt.findFirst({
      where: {
        eventId,
        status: "IN_PROGRESS",
        lockedBy: judgeId,
        result: "PENDING",
      },
      include: attemptInclude,
      orderBy: {
        lockedAt: "asc",
      },
    })

    if (existing) {
      return existing
    }

    if (options.autoClaimOnly) {
      return null
    }

    const now = new Date()
    const candidate = await prisma.attempt.findFirst({
      where: {
        eventId,
        status: "QUEUED",
        result: "PENDING",
      },
      orderBy: [
        { timestamp: "asc" },
        { attemptNumber: "asc" },
      ],
    })

    if (!candidate) {
      return null
    }

    const updated = await prisma.attempt.updateMany({
      where: {
        id: candidate.id,
        status: "QUEUED",
        result: "PENDING",
      },
      data: {
        status: "IN_PROGRESS",
        lockedBy: judgeId,
        lockedAt: now,
      },
    })

    if (updated.count === 0) {
      // Another judge claimed first, retry recursively
      return this.claimAttempt(eventId, judgeId, options)
    }

    return prisma.attempt.findUnique({
      where: { id: candidate.id },
      include: attemptInclude,
    })
  }

  /**
   * Release a lock held by a judge (e.g., if they abort judging)
   */
  static async releaseAttemptLock(attemptId: string, judgeId: string) {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
    })

    if (!attempt || attempt.status !== "IN_PROGRESS") {
      return null
    }

    if (attempt.lockedBy !== judgeId) {
      throw new Error("Cannot release a lock held by another judge")
    }

    const released = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "QUEUED",
        lockedAt: null,
        lockedBy: null,
      },
      include: attemptInclude,
    })

    return released
  }
}
