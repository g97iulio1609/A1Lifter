import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import EmailProvider from "next-auth/providers/email"
import GoogleProvider from "next-auth/providers/google"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Load user permissions and role from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            permissions: true,
            judgeProfile: true,
          },
        })
        
        if (dbUser) {
          token.role = dbUser.role
          token.permissions = dbUser.permissions
          token.isJudge = !!dbUser.judgeProfile
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.permissions = token.permissions
        session.user.isJudge = token.isJudge
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Auto-create user permissions if they don't exist
      if (account?.provider === "google" || account?.provider === "email") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { permissions: true }
        })
        
        if (existingUser && !existingUser.permissions) {
          await prisma.userPermission.create({
            data: {
              userId: existingUser.id,
              canViewLiveResults: true,
              // Default permissions for new users
            }
          })
        }
      }
      return true
    },
  },
  events: {
    async createUser({ user }) {
      // Create default permissions for new users
      await prisma.userPermission.create({
        data: {
          userId: user.id,
          canViewLiveResults: true,
          // Set default permissions
        }
      })
    },
  },
})