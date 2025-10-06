"use client"

import { SessionProvider } from "next-auth/react"
import { QueryProvider } from "@/components/providers/query-provider"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider defaultTheme="system">
          {children}
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  )
}