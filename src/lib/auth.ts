// src/lib/auth.ts

import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { Role } from '@prisma/client';

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://");

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      // --- THIS SECTION WAS MISSING ---
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      // ---------------------------------
      async authorize(credentials) {
        console.log('[DEBUG] Authorize function started.');

        if (!credentials?.email) {
          console.log('[DEBUG] No email provided.');
          return null;
        }
        
        try {
          console.log(`[DEBUG] Database query started for user: ${credentials.email}`);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { tenant: true }
          });
          
          console.log('[DEBUG] Database query finished. User object found:', user);

          if (!user) {
            console.log('[DEBUG] User not found in database.');
            return null;
          }

          if (user.role !== 'SUPER_ADMIN' && !user.tenant.isActive) {
            console.log('[DEBUG] Login rejected: Tenant is inactive.');
            throw new Error('Your account has been deactivated.');
          }

          console.log('[DEBUG] Comparing password...');
          const isPasswordValid = await compare(credentials.password!, user.password);

          if (!isPasswordValid) {
            console.log('[DEBUG] Password validation failed.');
            return null;
          }
          
          console.log('[DEBUG] Password is valid. Returning user object.');
          return user;

        } catch (error) {
            console.error('[DEBUG] An error occurred during authorization:', error);
            return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role as Role;
        session.user.tenantId = token.tenantId;
      }
      return session;
    }
  },
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        domain: useSecureCookies ? 'jnexmultitenant.vercel.app' : undefined,
      },
    },
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