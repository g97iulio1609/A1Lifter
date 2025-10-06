import nodemailer from "nodemailer"

/**
 * Email service configuration
 * Configure with your SMTP provider (Gmail, SendGrid, AWS SES, etc.)
 */

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

/**
 * Create email transporter
 * Configure with environment variables
 */
function createTransporter() {
  // For development, use ethereal.email test account
  // For production, use real SMTP credentials
  
  if (process.env.NODE_ENV === "production" && process.env.EMAIL_SERVER) {
    return nodemailer.createTransport(process.env.EMAIL_SERVER)
  }

  // Configuration for common providers
  if (process.env.EMAIL_PROVIDER === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  }

  if (process.env.EMAIL_PROVIDER === "sendgrid") {
    return nodemailer.createTransporter({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    })
  }

  // Default: Use environment variables for custom SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }

  // Fallback to console logging if no email config
  console.warn("No email configuration found. Emails will be logged to console.")
  return null
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter()

    if (!transporter) {
      // Log email to console in development
      console.log("📧 Email would be sent:")
      console.log("To:", options.to)
      console.log("Subject:", options.subject)
      console.log("Content:", options.text || options.html)
      return true
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@a1lifter.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

/**
 * Email template helpers
 */

export function wrapEmailTemplate(content: string, title: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #fff;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 10px 0;
        }
        .button:hover {
          background: #5a67d8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏋️ A1Lifter</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} A1Lifter. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
}
