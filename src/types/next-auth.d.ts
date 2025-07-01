// src/types/next-auth.d.ts

import { Role } from "@prisma/client" // Import the Role enum from Prisma
import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email: string
      role: Role // Use the Role enum for type safety
      tenantId: string // <-- ADDED tenantId
    }
  }

  interface User {
    id: string
    name?: string | null
    email: string
    role: Role // Use the Role enum
    tenantId: string // <-- ADDED tenantId
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role // Use the Role enum
    tenantId: string // <-- ADDED tenantId
  }
}