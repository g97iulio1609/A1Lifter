"use client"

import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: "white",
          color: "black",
          border: "1px solid #e5e7eb",
        },
        className: "sonner-toast",
        duration: 4000,
      }}
      richColors
      closeButton
    />
  )
}
