import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Force password change if required
    if (token?.mustChangePassword && pathname !== "/auth/change-password") {
      const url = new URL("/auth/change-password", req.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }

    // Enforce HTTPS in production
    if (
      process.env.NODE_ENV === "production" &&
      req.headers.get("x-forwarded-proto") !== "https"
    ) {
      return NextResponse.redirect(
        `https://${req.headers.get("host")}${pathname}`,
        301
      )
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated
        if (token) return true
        
        // Allow access to public routes
        const { pathname } = req.nextUrl
        if (
          pathname === "/" ||
          pathname === "/auth/signin" ||
          pathname === "/auth/signup" ||
          pathname === "/auth/change-password" ||
          pathname.startsWith("/public") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/health") ||
          pathname.startsWith("/api/ready")
        ) {
          return true
        }
        
        return false
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}