"use client"

import { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { captureException } from "@/lib/observability"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    captureException(error, {
      level: "error",
      extra: {
        componentStack: errorInfo.componentStack,
      },
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError)
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              We&apos;re sorry, but something unexpected happened. Please try again.
            </p>
            {process.env.NODE_ENV === "development" && (
              <pre className="mt-4 overflow-auto rounded-md bg-gray-100 p-4 text-left text-xs text-red-600 dark:bg-gray-800">
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            )}
            <Button
              onClick={this.resetError}
              className="mt-6"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
