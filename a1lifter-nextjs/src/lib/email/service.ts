import nodemailer from "nodemailer"

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

let cachedTransporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !port || !user || !pass) {
    console.warn("SMTP configuration is incomplete. Email notifications are disabled.")
    return null
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  return cachedTransporter
}

export const EmailService = {
  isConfigured(): boolean {
    return Boolean(
      process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD &&
        process.env.EMAIL_FROM
    )
  },

  async sendMail(options: SendEmailOptions) {
    const transporter = getTransporter()
    if (!transporter) {
      return false
    }

    const from = process.env.EMAIL_FROM || "no-reply@a1lifter.com"
    try {
      await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      })
      return true
    } catch (error) {
      console.error("Failed to send email:", error)
      return false
    }
  },
}
