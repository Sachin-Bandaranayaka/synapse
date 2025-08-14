// src/app/api/orders/[orderId]/status/route.ts

import { updateOrderStatus } from '@/lib/orders';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const UpdateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED']),
  returnCost: z.number().min(0, 'Return cost cannot be negative').optional(),
  shippingId: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    
    const resolvedParams = await params;const session = await getServerSession(authOptions);

    // 1. Check for session and tenantId
    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const { status, returnCost, shippingId } = UpdateOrderStatusSchema.parse(json);

    // Additional validation for return processing
    if (status === 'RETURNED') {
      // Business rule: Return cost is required when processing returns
      if (returnCost === undefined) {
        return NextResponse.json({
          error: 'Return cost is required when processing returns'
        }, { status: 400 });
      }

      // Business rule: Validate return cost is reasonable
      if (returnCost > 10000) { // Arbitrary high limit
        return NextResponse.json({
          error: 'Return cost exceeds maximum allowed amount'
        }, { status: 400 });
      }
    }

    // 2. Pass the tenantId, userId, and returnCost to the update function
    const order = await updateOrderStatus(resolvedParams.orderId, status, session.user.tenantId, session.user.id, returnCost, shippingId);

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order status update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({
      error: 'Failed to update order status'
    }, { status: 500 });
  }
}