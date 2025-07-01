// src/lib/auth.ts

import { AuthOptions } from 'next-auth';
import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { Role } from '@prisma/client';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Fetch the user AND their related tenant information in one query
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            tenant: true, // <-- Include the tenant data
          }
        });

        if (!user) {
          return null;
        }

        // --- NEW SECURITY CHECK ---
        // Check if the user's tenant is active.
        // We allow SUPER_ADMIN to log in regardless of tenant status.
        if (user.role !== 'SUPER_ADMIN' && !user.tenant.isActive) {
          // Throw an error that NextAuth will catch and display on the sign-in page
          throw new Error('Your account has been deactivated. Please contact support.');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Return the full user object including tenantId
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // Remove the cast to Role type
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.tenantId = token.tenantId;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export async function getSession() {
  return await getServerSession(authOptions);
}