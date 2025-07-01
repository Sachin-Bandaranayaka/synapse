// src/app/api/inventory/[productId]/history/route.ts

import { getStockHistory } from '@/lib/inventory';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Check for session and tenantId
    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Pass the tenantId to the secure function
    const stockHistory = await getStockHistory(params.productId, session.user.tenantId);

    return NextResponse.json(stockHistory);
  } catch (error) {
    console.error('Stock history error:', error);
    return NextResponse.json({
      error: 'Failed to fetch stock history'
    }, { status: 500 });
  }
}