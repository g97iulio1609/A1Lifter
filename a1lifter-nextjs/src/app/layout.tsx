import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Providers } from "@/components/providers/providers"
import "./globals.css"
import { AppLayout } from "@/components/layout/AppLayout"
import { defaultLocale, locales, type Locale } from "@/i18n/config"

export const metadata: Metadata = {
  title: "A1Lifter - Competition Management Platform",
  description: "Multisport competition management platform for powerlifting, weightlifting, strongman, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = cookies()
  const localeCookie = cookieStore.get("locale")?.value as Locale | undefined
  const locale = localeCookie && locales.includes(localeCookie) ? localeCookie : defaultLocale

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <Providers initialLocale={locale}>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  )
}
