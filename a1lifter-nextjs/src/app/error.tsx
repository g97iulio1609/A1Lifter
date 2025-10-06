"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"
import { captureException } from "@/lib/observability"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to Sentry
    captureException(error, {
      level: "error",
      extra: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="max-w-md text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-6 text-4xl font-bold text-slate-900 dark:text-slate-100">
          Something went wrong
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          We encountered an unexpected error. Our team has been notified and we&apos;re working on a fix.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-left dark:bg-red-950">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
              Error Details (Development Only):
            </p>
            <pre className="mt-2 overflow-auto text-xs text-red-700 dark:text-red-300">
              {error.message}
            </pre>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="min-w-[200px]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" className="min-w-[200px]">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
