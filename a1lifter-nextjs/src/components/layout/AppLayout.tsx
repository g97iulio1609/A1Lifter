"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { MainNav } from "@/components/navigation/MainNav"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: ReactNode
}

const AUTH_FREE_ROUTES = ["/auth/signin", "/auth/signup"]

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const showNavigation = pathname ? !AUTH_FREE_ROUTES.some((route) => pathname.startsWith(route)) : true

  return (
    <div className="relative min-h-screen bg-slate-50">
      {showNavigation && <MainNav />}
      <main
        className={cn(
          "min-h-screen transition-all",
          showNavigation ? "pt-16" : "pt-0"
        )}
      >
        {children}
      </main>
      <Toaster />
    </div>
  )
}
