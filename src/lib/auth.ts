// src/lib/auth.ts

import { AuthOptions } from 'next-auth';
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
        if (!credentials?.email || !credentials.password) { return null; }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true }
        });

        if (!user) { return null; }

        if (user.role !== 'SUPER_ADMIN' && !user.tenant.isActive) {
          throw new Error('Your account has been deactivated.');
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) { return null; }

        return {
          id: user.id, email: user.email, name: user.name,
          role: user.role, tenantId: user.tenantId,
        };
      }
    })
  ],
  callbacks: {
    // We are removing the redirect callback.
    // The JWT and Session callbacks remain.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getSession() {
  return await getServerSession(authOptions);
}