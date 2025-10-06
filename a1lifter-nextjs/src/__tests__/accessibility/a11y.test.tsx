/**
 * Accessibility tests for WCAG 2.1 AA compliance
 */

import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { MainNav } from "@/components/navigation/MainNav"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ResponsiveTable } from "@/components/ui/responsive-table"

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}))

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock theme provider
vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
}))

describe("Accessibility", () => {
  describe("MainNav", () => {
    it("should have proper ARIA label on nav element", () => {
      const { container } = render(<MainNav />)
      const nav = container.querySelector("nav")
      expect(nav).toHaveAttribute("aria-label", "Main navigation")
    })

    it("should have accessible theme toggle button", () => {
      const { getByRole } = render(<ThemeToggle />)
      const button = getByRole("button", { name: /toggle theme/i })
      expect(button).toBeInTheDocument()
    })
  })

  describe("Touch Targets", () => {
    it("theme toggle should meet minimum size requirements (44x44px)", () => {
      const { getByRole } = render(<ThemeToggle />)
      const button = getByRole("button", { name: /toggle theme/i })
      const classes = button.className
      expect(classes).toContain("min-h-[44px]")
      expect(classes).toContain("min-w-[44px]")
    })
  })

  describe("ResponsiveTable", () => {
    const mockData = [
      { id: "1", name: "John Doe", score: 100 },
      { id: "2", name: "Jane Smith", score: 95 },
    ]

    const mockColumns = [
      { header: "Name", accessor: "name" as const },
      { header: "Score", accessor: "score" as const },
    ]

    it("should render table with proper semantic structure", () => {
      const { container } = render(
        <ResponsiveTable
          data={mockData}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
        />
      )

      // Check for table structure
      const table = container.querySelector("table")
      expect(table).toBeInTheDocument()

      // Check for thead and tbody
      expect(container.querySelector("thead")).toBeInTheDocument()
      expect(container.querySelector("tbody")).toBeInTheDocument()
    })

    it("should have accessible empty state", () => {
      const { getByText } = render(
        <ResponsiveTable
          data={[]}
          columns={mockColumns}
          keyExtractor={(item) => item.id}
          emptyMessage="No data found"
        />
      )

      expect(getByText("No data found")).toBeInTheDocument()
    })
  })

  describe("Keyboard Navigation", () => {
    it("buttons should be keyboard accessible", () => {
      const { getByRole } = render(<ThemeToggle />)
      const button = getByRole("button")

      // Button should be focusable
      expect(button).not.toHaveAttribute("tabindex", "-1")
    })
  })
})
