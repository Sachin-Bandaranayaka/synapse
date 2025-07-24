// src/app/api/debug-auth/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'http';

  // This object will check the critical environment variables as Vercel sees them.
  const debugInfo = {
    "Note": "This is a temporary debug endpoint. Please delete this file after use.",
    "EXPECTED_NEXTAUTH_URL": `https://${host}`,
    "ACTUAL_NEXTAUTH_URL_FROM_ENV": process.env.NEXTAUTH_URL,
    "URLS_MATCH": `https://${host}` === process.env.NEXTAUTH_URL,
    "HAS_NEXTAUTH_SECRET": !!process.env.NEXTAUTH_SECRET,
    "NEXTAUTH_SECRET_LENGTH": process.env.NEXTAUTH_SECRET?.length || 0,
    "NODE_ENV": process.env.NODE_ENV,
  };

  return NextResponse.json(debugInfo);
}