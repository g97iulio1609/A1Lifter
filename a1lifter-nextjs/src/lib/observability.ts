// Lightweight, optional error tracking integration points for P2
// KISS: no dependencies; plug real SDKs here in later commits (e.g., Sentry)

import { logger } from "@/lib/logger"

type CaptureOptions = {
  tags?: Record<string, string>
  extra?: Record<string, unknown>
}

export function initObservability() {
  // Example env-driven toggle; real SDK init can go here
  if (process.env.NEXT_RUNTIME === "nodejs") {
    logger.info("Observability initialized", {
      release: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
    })
  }
}

export function captureException(err: unknown, opts: CaptureOptions = {}) {
  const message = err instanceof Error ? err.message : String(err)
  logger.error("Captured exception", { message, ...opts })
}

export function captureMessage(message: string, opts: CaptureOptions = {}) {
  logger.warn("Captured message", { message, ...opts })
}

