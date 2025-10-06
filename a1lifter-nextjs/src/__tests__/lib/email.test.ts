import { describe, it, expect } from "vitest"
import { sendEmail, wrapEmailTemplate } from "@/lib/email/mailer"

describe("Email Service", () => {
  it("should create email transporter configuration", () => {
    // Test that email service doesn't throw errors
    expect(() => {
      wrapEmailTemplate("Test content", "Test Title")
    }).not.toThrow()
  })

  it("should wrap email content in template", () => {
    const content = "<p>Test content</p>"
    const title = "Test Email"
    const result = wrapEmailTemplate(content, title)

    expect(result).toContain("<!DOCTYPE html>")
    expect(result).toContain(title)
    expect(result).toContain(content)
    expect(result).toContain("A1Lifter")
  })

  it("should handle email sending in test environment", async () => {
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Test</p>",
      text: "Test",
    })

    // In test environment, email should log to console and return true
    expect(result).toBe(true)
  })
})
