// src/app/api/orders/bulk/mark-printed/route.ts

import { getScopedPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const MarkPrintedSchema = z.object({
  orderIds: z.array(z.string()),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const prisma = getScopedPrismaClient(session.user.tenantId);
    const json = await request.json();
    const { orderIds } = MarkPrintedSchema.parse(json);

    if (orderIds.length === 0) {
      return NextResponse.json({ message: 'No orders to update.' });
    }

    // Use updateMany for an efficient bulk update
    const result = await prisma.order.updateMany({
      where: {
        id: {
          in: orderIds,
        },
      },
      data: {
        invoicePrinted: true,
      },
    });

    return NextResponse.json({
      message: `Successfully updated ${result.count} orders.`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error marking orders as printed:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update orders' }, { status: 500 });
  }
}
