import { checkLowStock } from '@/lib/inventory';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const threshold = searchParams.get('threshold');
    const thresholdNumber = threshold ? parseInt(threshold) : undefined;

    const lowStockProducts = await checkLowStock(session.user.tenantId, thresholdNumber);

    return NextResponse.json(lowStockProducts);
  } catch (error) {
    console.error('Low stock check error:', error);
    return NextResponse.json({
      error: 'Failed to check low stock'
    }, { status: 500 });
  }
}
