// src/types/next-auth.d.ts

import { Role } from "@prisma/client"
import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email: string
      role: Role
      tenantId: string
      permissions: string[] // <-- ADD THIS LINE
    }
  }

  interface User {
    id: string
    name?: string | null
    email: string
    role: Role
    tenantId: string
    permissions: string[] // <-- ADD THIS LINE
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    tenantId: string
    permissions: string[] // <-- ADD THIS LINE
  }
}