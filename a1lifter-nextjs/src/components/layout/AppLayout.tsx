"use client"

import { ReactNode, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MainNav } from "@/components/navigation/MainNav"
import { Toaster } from "sonner"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: ReactNode
}

const AUTH_FREE_ROUTES = ["/auth/signin", "/auth/signup", "/auth/change-password"]

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const showNavigation = pathname ? !AUTH_FREE_ROUTES.some((route) => pathname.startsWith(route)) : true

  // Redirect to change password if required
  useEffect(() => {
    if (
      session?.user?.mustChangePassword &&
      pathname !== "/auth/change-password" &&
      !AUTH_FREE_ROUTES.includes(pathname || "")
    ) {
      router.push("/auth/change-password")
    }
  }, [session, pathname, router])

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
