"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import type { ComponentType, SVGProps } from "react"
import { useSession, signOut } from "next-auth/react"
import {
  Menu,
  X,
  LogIn,
  LogOut,
  LayoutDashboard,
  CalendarCheck,
  Users,
  ClipboardList,
  PlayCircle,
  Gavel,
  BarChart3,
  Settings,
  Home,
  PlusCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { NotificationsMenu } from "./NotificationsMenu"
import { ThemeToggle } from "@/components/ui/theme-toggle"

type Role = "ADMIN" | "ORGANIZER" | "JUDGE" | "ATHLETE"

interface NavItem {
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  roles?: Role[]
  cta?: boolean
}

const AUTH_FREE_ROUTES = ["/auth/signin", "/auth/signup"]

const PRIVATE_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Events",
    href: "/events",
    icon: CalendarCheck,
    roles: ["ADMIN", "ORGANIZER"],
  },
  {
    label: "Athletes",
    href: "/athletes",
    icon: Users,
    roles: ["ADMIN", "ORGANIZER"],
  },
  {
    label: "Registrations",
    href: "/registrations",
    icon: ClipboardList,
    roles: ["ADMIN", "ORGANIZER", "ATHLETE"],
  },
  {
    label: "Live",
    href: "/live",
    icon: PlayCircle,
  },
  {
    label: "Judge",
    href: "/judge",
    icon: Gavel,
    roles: ["ADMIN", "ORGANIZER", "JUDGE"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["ADMIN", "ORGANIZER"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

const PUBLIC_NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Live Results",
    href: "/live",
    icon: PlayCircle,
  },
  {
    label: "Judge",
    href: "/judge",
    icon: Gavel,
  },
]

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAuthRoute = pathname ? AUTH_FREE_ROUTES.some((route) => pathname.startsWith(route)) : false

  const navItems = useMemo(() => {
    if (!session) {
      return PUBLIC_NAV_ITEMS
    }

    const userRole = session.user.role as Role | undefined

    return PRIVATE_NAV_ITEMS.filter((item) => {
      if (!item.roles) return true
      if (!userRole) return false
      return item.roles.includes(userRole)
    })
  }, [session])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const renderNavItems = (isMobile = false) => (
    <ul className={cn("flex items-center gap-4", isMobile ? "flex-col items-start gap-2" : "")}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

        return (
          <li key={item.href}>
            <Link href={item.href} onClick={() => isMobile && setMobileOpen(false)}>
              <span
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-500"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                  isMobile && "w-full"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          </li>
        )
      })}
      {session && navItems.some((item) => item.href === "/events") && (
        <li>
          <Link href="/events/create" onClick={() => isMobile && setMobileOpen(false)}>
            <span
              className={cn(
                "flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700",
                isMobile && "w-full"
              )}
            >
              <PlusCircle className="h-4 w-4" />
              New Event
            </span>
          </Link>
        </li>
      )}
    </ul>
  )

  if (isAuthRoute) {
    return null
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-700 dark:bg-slate-900/95 dark:supports-[backdrop-filter]:bg-slate-900/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
            <span className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-bold uppercase tracking-widest text-white dark:bg-indigo-500">
              A1
            </span>
            <span>A1Lifter</span>
          </Link>
          {session?.user?.role && (
            <Badge variant="secondary" className="hidden text-xs font-medium uppercase text-indigo-700 sm:inline-flex">
              {session.user.role}
            </Badge>
          )}
        </div>

        <div className="hidden items-center gap-6 lg:flex">
          {renderNavItems()}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <>
              <NotificationsMenu userId={session.user.id} />
              <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">{session.user.email}</span>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900 lg:hidden">
          <div className="flex flex-col gap-4">
            {session?.user?.role && (
              <Badge variant="outline" className="w-fit text-xs uppercase text-indigo-700">
                {session.user.role}
              </Badge>
            )}
            {renderNavItems(true)}
            {session ? (
              <Button
                variant="secondary"
                className="mt-2 flex items-center gap-2"
                onClick={async () => {
                  await handleSignOut()
                  setMobileOpen(false)
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            ) : (
              <Link href="/auth/signin" onClick={() => setMobileOpen(false)}>
                <Button className="mt-2 flex w-full items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
