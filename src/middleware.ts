// src/middleware.ts

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/auth');
  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return null;
  }

  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // We are removing the database check from here.
  // The rest of the logic can remain for basic role checks.
  const userRole = token.role;
  const isSuperAdminRoute = pathname.startsWith('/superadmin');

  if (isSuperAdminRoute && userRole !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  const isAuthorizedRole = ['ADMIN', 'SUPER_ADMIN', 'TEAM_MEMBER'].includes(userRole);

  if (!isAuthorizedRole) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};