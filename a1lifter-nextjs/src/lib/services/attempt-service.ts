/**
 * Attempt Service - Business logic for attempt operations
 */

import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import type { CreateAttemptInput, UpdateAttemptInput, AttemptQuery } from "@/lib/validations/attempts"

export class AttemptService {
  /**
   * Get attempts with optional filters
   */
  static async getAttempts(query: AttemptQuery) {
    const { eventId, userId, categoryId, lift, result, limit = 50, offset = 0 } = query

    const where: Prisma.AttemptWhereInput = {
      ...(eventId && { eventId }),
      ...(userId && { userId }),
      ...(categoryId && { categoryId }),
      ...(lift && { lift }),
      ...(result && { result }),
    }

    const [attempts, total] = await Promise.all([
      prisma.attempt.findMany({
        where,
        include: {
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
        },
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: true,
        category: true,
        registration: true,
      },
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
        timestamp: new Date(),
      },
      include: {
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
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return attempt
  }

  /**
   * Update attempt (for judges)
   */
  static async updateAttempt(id: string, data: UpdateAttemptInput, judgedBy?: string) {
    const attempt = await prisma.attempt.findUnique({
      where: { id },
    })

    if (!attempt) {
      throw new Error("Attempt not found")
    }

    if (attempt.result !== "PENDING" && data.result) {
      throw new Error("Cannot change result of already judged attempt")
    }

    const updated = await prisma.attempt.update({
      where: { id },
      data: {
        ...data,
        ...(data.result && {
          judgedAt: new Date(),
          judgedBy,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Create notification for athlete
    if (data.result && data.result !== "PENDING") {
      await prisma.notification.create({
        data: {
          userId: attempt.userId,
          type: "RESULT_POSTED",
          title: "Attempt Result",
          message: `Your ${attempt.lift} attempt #${attempt.attemptNumber} was judged: ${data.result}`,
          data: {
            attemptId: id,
            result: data.result,
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

    if (attempt.result !== "PENDING") {
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
  static async getCurrentAttempt(eventId: string) {
    const attempt = await prisma.attempt.findFirst({
      where: {
        eventId,
        result: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { timestamp: "asc" },
        { attemptNumber: "asc" },
      ],
    })

    return attempt
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
}
