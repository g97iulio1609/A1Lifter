import { sendEmail, wrapEmailTemplate } from "./mailer"

/**
 * Email notification templates
 */

export async function sendRegistrationApprovedEmail(
  to: string,
  data: {
    athleteName: string
    eventName: string
    eventDate: string
    eventLocation: string
  }
): Promise<boolean> {
  const content = `
    <h2>Registration Approved! 🎉</h2>
    <p>Hello ${data.athleteName},</p>
    <p>Great news! Your registration for <strong>${data.eventName}</strong> has been approved.</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Event Details</h3>
      <p><strong>Event:</strong> ${data.eventName}</p>
      <p><strong>Date:</strong> ${data.eventDate}</p>
      <p><strong>Location:</strong> ${data.eventLocation}</p>
    </div>
    
    <p>Please make sure to arrive on time and bring your ID for check-in.</p>
    <p>Good luck with your lifts!</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" class="button">View Event Details</a>
  `

  return sendEmail({
    to,
    subject: `Registration Approved - ${data.eventName}`,
    html: wrapEmailTemplate(content, "Registration Approved"),
    text: `Hello ${data.athleteName}, Your registration for ${data.eventName} has been approved.`,
  })
}

export async function sendRegistrationRejectedEmail(
  to: string,
  data: {
    athleteName: string
    eventName: string
    reason?: string
  }
): Promise<boolean> {
  const content = `
    <h2>Registration Update</h2>
    <p>Hello ${data.athleteName},</p>
    <p>Unfortunately, your registration for <strong>${data.eventName}</strong> could not be approved at this time.</p>
    
    ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
    
    <p>If you have any questions, please contact the event organizer.</p>
  `

  return sendEmail({
    to,
    subject: `Registration Update - ${data.eventName}`,
    html: wrapEmailTemplate(content, "Registration Update"),
    text: `Hello ${data.athleteName}, Your registration for ${data.eventName} could not be approved.`,
  })
}

export async function sendAttemptUpcomingEmail(
  to: string,
  data: {
    athleteName: string
    eventName: string
    lift: string
    attemptNumber: number
    weight: number
    estimatedTime: string
  }
): Promise<boolean> {
  const content = `
    <h2>Your Attempt is Coming Up! ⏰</h2>
    <p>Hello ${data.athleteName},</p>
    <p>Get ready! Your next attempt is scheduled soon.</p>
    
    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3 style="margin-top: 0;">Attempt Details</h3>
      <p><strong>Lift:</strong> ${data.lift}</p>
      <p><strong>Attempt:</strong> #${data.attemptNumber}</p>
      <p><strong>Weight:</strong> ${data.weight}kg</p>
      <p><strong>Estimated Time:</strong> ${data.estimatedTime}</p>
    </div>
    
    <p>Please head to the warm-up area and be ready when called.</p>
    <p>Best of luck! 💪</p>
  `

  return sendEmail({
    to,
    subject: `Attempt Upcoming - ${data.eventName}`,
    html: wrapEmailTemplate(content, "Attempt Upcoming"),
    text: `Hello ${data.athleteName}, Your ${data.lift} attempt #${data.attemptNumber} (${data.weight}kg) is coming up at ${data.estimatedTime}.`,
  })
}

export async function sendResultPostedEmail(
  to: string,
  data: {
    athleteName: string
    eventName: string
    lift: string
    attemptNumber: number
    weight: number
    result: "GOOD" | "NO_LIFT" | "DISQUALIFIED"
  }
): Promise<boolean> {
  const resultEmoji = {
    GOOD: "✅",
    NO_LIFT: "❌",
    DISQUALIFIED: "🚫",
  }

  const resultColor = {
    GOOD: "#10b981",
    NO_LIFT: "#ef4444",
    DISQUALIFIED: "#f59e0b",
  }

  const content = `
    <h2>Attempt Result Posted ${resultEmoji[data.result]}</h2>
    <p>Hello ${data.athleteName},</p>
    <p>Your attempt result has been recorded.</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${resultColor[data.result]};">
      <h3 style="margin-top: 0;">Result Details</h3>
      <p><strong>Lift:</strong> ${data.lift}</p>
      <p><strong>Attempt:</strong> #${data.attemptNumber}</p>
      <p><strong>Weight:</strong> ${data.weight}kg</p>
      <p><strong>Result:</strong> <span style="color: ${resultColor[data.result]}; font-weight: bold;">${data.result}</span></p>
    </div>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" class="button">View Full Results</a>
  `

  return sendEmail({
    to,
    subject: `Attempt Result - ${data.eventName}`,
    html: wrapEmailTemplate(content, "Attempt Result"),
    text: `Hello ${data.athleteName}, Your ${data.lift} attempt #${data.attemptNumber} (${data.weight}kg) result: ${data.result}.`,
  })
}

export async function sendEventUpdateEmail(
  to: string,
  data: {
    athleteName: string
    eventName: string
    updateMessage: string
  }
): Promise<boolean> {
  const content = `
    <h2>Event Update 📢</h2>
    <p>Hello ${data.athleteName},</p>
    <p>There is an update regarding <strong>${data.eventName}</strong>.</p>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p>${data.updateMessage}</p>
    </div>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" class="button">View Event Details</a>
  `

  return sendEmail({
    to,
    subject: `Event Update - ${data.eventName}`,
    html: wrapEmailTemplate(content, "Event Update"),
    text: `Hello ${data.athleteName}, Event update for ${data.eventName}: ${data.updateMessage}`,
  })
}

export async function sendWelcomeEmail(
  to: string,
  data: {
    name: string
  }
): Promise<boolean> {
  const content = `
    <h2>Welcome to A1Lifter! 🎉</h2>
    <p>Hello ${data.name},</p>
    <p>Welcome to A1Lifter - your comprehensive competition management platform.</p>
    
    <p>With A1Lifter, you can:</p>
    <ul>
      <li>Register for competitions</li>
      <li>Track your lifts and progress</li>
      <li>View live results</li>
      <li>Connect with other athletes</li>
    </ul>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Get Started</a>
    
    <p>If you have any questions, feel free to reach out to our support team.</p>
  `

  return sendEmail({
    to,
    subject: "Welcome to A1Lifter!",
    html: wrapEmailTemplate(content, "Welcome"),
    text: `Hello ${data.name}, Welcome to A1Lifter!`,
  })
}
