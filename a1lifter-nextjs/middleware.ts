import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
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
          pathname.startsWith("/public") ||
          pathname.startsWith("/api/auth")
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