import { format } from "date-fns"

interface AttemptResultTemplateOptions {
  athleteName: string
  eventName: string
  lift: string
  weight: number
  attemptNumber: number
  result: string
  judgedAt?: Date | string | null
  videoUrl?: string | null
}

interface RegistrationStatusTemplateOptions {
  athleteName: string
  eventName: string
  status: string
  notes?: string | null
}

export function attemptResultTemplate(options: AttemptResultTemplateOptions) {
  const judgedAtFormatted = options.judgedAt
    ? format(new Date(options.judgedAt), "PPpp")
    : undefined

  return {
    subject: `Attempt result for ${options.eventName}`,
    text: `Hello ${options.athleteName},\n\nYour ${options.lift} attempt #${options.attemptNumber} at ${options.weight}kg was judged ${options.result}.\n${
      judgedAtFormatted ? `Judged at: ${judgedAtFormatted}\n` : ""
    }${options.videoUrl ? `Video: ${options.videoUrl}\n` : ""}\nThank you for competing with A1Lifter!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Attempt result notification</h2>
        <p>Hi <strong>${options.athleteName}</strong>,</p>
        <p>
          Your <strong>${options.lift}</strong> attempt #${options.attemptNumber} at
          <strong>${options.weight}kg</strong> has been judged:
          <strong>${options.result}</strong>.
        </p>
        ${
          judgedAtFormatted
            ? `<p><strong>Judged at:</strong> ${judgedAtFormatted}</p>`
            : ""
        }
        ${
          options.videoUrl
            ? `<p>You can review the video recording here: <a href="${options.videoUrl}">${options.videoUrl}</a></p>`
            : ""
        }
        <p>Thank you for competing with A1Lifter!</p>
      </div>
    `,
  }
}

export function registrationStatusTemplate(options: RegistrationStatusTemplateOptions) {
  return {
    subject: `Registration ${options.status.toLowerCase()} for ${options.eventName}`,
    text: `Hello ${options.athleteName},\n\nYour registration for ${options.eventName} is now ${options.status.toLowerCase()}.\n${
      options.notes ? `Notes: ${options.notes}\n` : ""
    }\nSee you on the platform!`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Registration update</h2>
        <p>Hi <strong>${options.athleteName}</strong>,</p>
        <p>
          Your registration for <strong>${options.eventName}</strong> is now
          <strong>${options.status.toLowerCase()}</strong>.
        </p>
        ${options.notes ? `<p><strong>Notes:</strong> ${options.notes}</p>` : ""}
        <p>See you on the platform!</p>
      </div>
    `,
  }
}
