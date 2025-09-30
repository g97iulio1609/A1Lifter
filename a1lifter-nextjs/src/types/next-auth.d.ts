import { DefaultSession, DefaultUser } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
      permissions: any
      isJudge: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: UserRole
    permissions: any
    isJudge: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    permissions: any
    isJudge: boolean
  }
}