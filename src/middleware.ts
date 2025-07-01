// src/middleware.ts

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // We MUST explicitly pass the secret to getToken in the middleware
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/auth');

  if (isAuthPage) {
    // If the user is logged in and tries to go to the login page, redirect them home
    if (token) {
      const url = token.role === 'SUPER_ADMIN' ? '/superadmin' : '/dashboard';
      return NextResponse.redirect(new URL(url, request.url));
    }
    // Otherwise, allow them to see the login page
    return null;
  }

  // If the user is not logged in and is trying to access a protected page, redirect to signin
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // If a logged-in user tries to go to the wrong dashboard, correct it
  const userRole = token.role;
  if (userRole === 'SUPER_ADMIN' && !pathname.startsWith('/superadmin')) {
    return NextResponse.redirect(new URL('/superadmin', request.url));
  }
  if (userRole !== 'SUPER_ADMIN' && pathname.startsWith('/superadmin')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // If all checks pass, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};