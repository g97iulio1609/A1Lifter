"use client"

import { SessionProvider } from "next-auth/react"
import { QueryProvider } from "@/components/providers/query-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </QueryProvider>
  )
}