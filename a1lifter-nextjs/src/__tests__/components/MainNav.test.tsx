import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MainNav } from "@/components/navigation/MainNav"
import { useSession } from "next-auth/react"

vi.mock("next-auth/react")
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}))
vi.mock("@/components/navigation/NotificationsMenu", () => ({
  NotificationsMenu: () => <div data-testid="notifications-menu" />,
}))

describe("MainNav", () => {
  it("should render navigation links for authenticated user", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: "1", name: "Test User", role: "ADMIN", email: "test@example.com" },
        expires: "2025-12-31",
      },
      status: "authenticated",
      update: vi.fn(),
    })

    render(<MainNav />)

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Events")).toBeInTheDocument()
    expect(screen.getByText("Athletes")).toBeInTheDocument()
    expect(screen.getByTestId("notifications-menu")).toBeInTheDocument()
  })

  it("should not show admin links for regular users", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: "1", name: "Test User", role: "ATHLETE", email: "test@example.com" },
        expires: "2025-12-31",
      },
      status: "authenticated",
      update: vi.fn(),
    })

    render(<MainNav />)

    expect(screen.queryByText("Events")).not.toBeInTheDocument()
  })

  it("should show sign in link for unauthenticated users", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    })

    render(<MainNav />)

    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })
})
