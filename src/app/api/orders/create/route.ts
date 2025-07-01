// src/app/api/orders/create/route.ts

import { createOrderFromLead } from '@/lib/orders';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateOrderSchema = z.object({
  leadId: z.string().uuid(),
  quantity: z.number().int().positive().default(1)
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Get session and tenantId
    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const { leadId, quantity } = CreateOrderSchema.parse(json);

    // Pass the tenantId down to the library function
    const order = await createOrderFromLead({
      leadId,
      userId: session.user.id,
      quantity,
      tenantId: session.user.tenantId, // <-- PASS THE TENANT ID
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create order' }, { status: 500 });
  }
}