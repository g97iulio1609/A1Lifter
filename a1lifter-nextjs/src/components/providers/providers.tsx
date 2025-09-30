"use client"

import { SessionProvider } from "next-auth/react"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        {children}
        <Toaster />
      </SessionProvider>
    </QueryProvider>
  )
}