type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: unknown
}

function format(message: string, context?: LogContext) {
  if (!context || Object.keys(context).length === 0) return message
  return `${message} | ${JSON.stringify(context)}`
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...context,
  }

  // Keep it simple and environment-agnostic
  // eslint-disable-next-line no-console
  console[level === "debug" ? "log" : level](format(message, context))

  return entry
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
}

export type { LogLevel, LogContext }

