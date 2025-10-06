"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-slate-900 dark:text-slate-100">404</h1>
        <h2 className="mt-4 text-3xl font-semibold text-slate-800 dark:text-slate-200">
          Page Not Found
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button className="min-w-[200px]">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="min-w-[200px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
