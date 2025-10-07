"use client"

import { SessionProvider } from "next-auth/react"
import { QueryProvider } from "@/components/providers/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/components/i18n/I18nProvider"

export function Providers({ children, initialLocale }: { children: React.ReactNode; initialLocale?: string }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider defaultTheme="system">
          <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  )
}