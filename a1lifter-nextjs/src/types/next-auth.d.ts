import { DefaultSession, DefaultUser } from "next-auth"
import { UserRole, UserPermission } from "@prisma/client"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: UserRole
      permissions: UserPermission | null
      isJudge: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: UserRole
    permissions: UserPermission | null
    isJudge: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    permissions: UserPermission | null
    isJudge: boolean
  }
}