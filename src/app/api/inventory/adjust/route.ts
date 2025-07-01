import { adjustStock } from '@/lib/inventory';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const AdjustStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(),
  reason: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only allow ADMIN and TEAM_MEMBER roles to adjust stock
    if (!['ADMIN', 'TEAM_MEMBER'].includes(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const json = await request.json();
    const data = AdjustStockSchema.parse(json);

    const updatedProduct = await adjustStock({
      productId: data.productId,
      quantity: data.quantity,
      reason: data.reason,
      userId: session.user.id,
      tenantId: session.user.tenantId,
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error adjusting stock:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}
