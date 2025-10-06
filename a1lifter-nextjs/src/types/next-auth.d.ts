import { DefaultSession, DefaultUser } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      mustChangePassword?: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: UserRole
    mustChangePassword?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    mustChangePassword?: boolean
  }
}