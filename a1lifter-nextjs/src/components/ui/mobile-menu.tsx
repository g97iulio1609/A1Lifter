/**
 * Mobile-optimized menu with touch targets
 */

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function MobileMenu({ isOpen, onClose, children, className }: MobileMenuProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-in menu */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

interface MobileMenuItemProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  active?: boolean
}

export function MobileMenuItem({
  children,
  onClick,
  className,
  active,
}: MobileMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Touch-friendly sizing (min 44x44px)
        "flex w-full items-center gap-3 px-4 py-3 text-left text-base font-medium transition-colors",
        active
          ? "bg-indigo-50 text-indigo-600"
          : "text-gray-700 hover:bg-gray-50",
        className
      )}
    >
      {children}
    </button>
  )
}
