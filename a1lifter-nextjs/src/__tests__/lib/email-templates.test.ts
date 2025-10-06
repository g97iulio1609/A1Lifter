import { describe, it, expect } from "vitest"
import {
  sendRegistrationApprovedEmail,
  sendAttemptUpcomingEmail,
  sendResultPostedEmail,
} from "@/lib/email/templates"

describe("Email Templates", () => {
  it("should send registration approved email", async () => {
    const result = await sendRegistrationApprovedEmail("test@example.com", {
      athleteName: "John Doe",
      eventName: "Test Competition",
      eventDate: "2024-01-15",
      eventLocation: "Test Location",
    })

    expect(result).toBe(true)
  })

  it("should send attempt upcoming email", async () => {
    const result = await sendAttemptUpcomingEmail("test@example.com", {
      athleteName: "John Doe",
      eventName: "Test Competition",
      lift: "SQUAT",
      attemptNumber: 2,
      weight: 150,
      estimatedTime: "10:30 AM",
    })

    expect(result).toBe(true)
  })

  it("should send result posted email", async () => {
    const result = await sendResultPostedEmail("test@example.com", {
      athleteName: "John Doe",
      eventName: "Test Competition",
      lift: "SQUAT",
      attemptNumber: 2,
      weight: 150,
      result: "GOOD",
    })

    expect(result).toBe(true)
  })
})
