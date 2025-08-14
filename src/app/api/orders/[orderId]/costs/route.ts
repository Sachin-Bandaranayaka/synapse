// src/app/api/orders/[orderId]/costs/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { profitCalculationService, ProfitCalculationService } from '@/lib/profit-calculation';
import { 
  ProfitCalculationError, 
  CostValidationError,
  getUserFriendlyErrorMessage,
  isRecoverableError
} from '@/lib/errors/profit-errors';

export const dynamic = 'force-dynamic';

const orderCostUpdateSchema = z.object({
  packagingCost: z.number().min(0).optional(),
  printingCost: z.number().min(0).optional(),
  returnCost: z.number().min(0).optional(),
});

// GET /api/orders/[orderId]/costs - Get order cost breakdown
export async function GET(
  request: Request, 
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const profitBreakdown = await profitCalculationService.calculateOrderProfit(
      orderId,
      session.user.tenantId
    );

    return NextResponse.json(profitBreakdown);
  } catch (error) {
    console.error('Error fetching order costs:', error);
    
    // Handle specific error types
    if (error instanceof ProfitCalculationError) {
      const status = error.code === 'ORDER_NOT_FOUND' ? 404 : 500;
      return NextResponse.json(
        { 
          error: getUserFriendlyErrorMessage(error),
          code: error.code,
          recoverable: isRecoverableError(error)
        },
        { status }
      );
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch order costs',
        recoverable: true
      },
      { status: 500 }
    );
  }
}

// POST /api/orders/[orderId]/costs - Update order costs manually
export async function POST(
  request: Request, 
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const canEditOrders = session.user.role === 'ADMIN' || 
                         session.user.permissions?.includes('EDIT_ORDERS');

    if (!canEditOrders) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const costUpdates = orderCostUpdateSchema.parse(body);

    // Validate cost inputs
    ProfitCalculationService.validateCosts(costUpdates);

    const updatedProfitBreakdown = await profitCalculationService.updateOrderCostsManually(
      orderId,
      session.user.tenantId,
      costUpdates
    );

    return NextResponse.json(updatedProfitBreakdown);
  } catch (error) {
    console.error('Error updating order costs:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid cost data format', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          })),
          recoverable: true
        },
        { status: 400 }
      );
    }

    if (error instanceof ProfitCalculationError || error instanceof CostValidationError) {
      const status = error instanceof ProfitCalculationError && error.code === 'ORDER_NOT_FOUND' ? 404 : 400;
      return NextResponse.json(
        { 
          error: getUserFriendlyErrorMessage(error),
          code: error instanceof ProfitCalculationError ? error.code : 'COST_VALIDATION_ERROR',
          recoverable: isRecoverableError(error)
        },
        { status }
      );
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update order costs',
        recoverable: true
      },
      { status: 500 }
    );
  }
}