// src/app/api/tenant/cost-config/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { CostTrackingService } from '@/lib/cost-tracking';
import { z } from 'zod';

const costConfigSchema = z.object({
  defaultPackagingCost: z.number().min(0).optional(),
  defaultPrintingCost: z.number().min(0).optional(),
  defaultReturnCost: z.number().min(0).optional(),
});

const costTrackingService = new CostTrackingService();

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access cost configuration
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const defaultCosts = await costTrackingService.getDefaultCosts(session.user.tenantId);
    
    return NextResponse.json(defaultCosts);
  } catch (error) {
    console.error('Error fetching cost configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update cost configuration
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = costConfigSchema.parse(body);

    await costTrackingService.updateTenantCostConfig(session.user.tenantId, validatedData);
    
    return NextResponse.json({ message: 'Cost configuration updated successfully' });
  } catch (error) {
    console.error('Error updating cost configuration:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update cost configuration' },
      { status: 500 }
    );
  }
}