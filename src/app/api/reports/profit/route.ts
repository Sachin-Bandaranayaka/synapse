import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getScopedPrismaClient } from '@/lib/prisma';
import { profitCalculationService } from '@/lib/profit-calculation';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

const profitReportSchema = z.object({
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'custom']).nullable().default('monthly'),
  productId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  status: z.nativeEnum(OrderStatus).nullable().optional(),
});

export interface PeriodProfitReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    orderCount: number;
    returnCount: number;
  };
  breakdown: {
    productCosts: number;
    leadCosts: number;
    packagingCosts: number;
    printingCosts: number;
    returnCosts: number;
  };
  trends: Array<{
    date: string;
    revenue: number;
    costs: number;
    profit: number;
    orderCount: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = profitReportSchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      period: searchParams.get('period') || 'monthly',
      productId: searchParams.get('productId'),
      userId: searchParams.get('userId'),
      status: searchParams.get('status'),
    });

    const prisma = getScopedPrismaClient(session.user.tenantId);

    // Calculate date range based on period
    const { startDate, endDate } = calculateDateRange(params.period || 'monthly', params.startDate || undefined, params.endDate || undefined);

    // Use the optimized profit calculation service
    const report = await profitCalculationService.calculatePeriodProfit(
      {
        startDate,
        endDate,
        period: params.period || 'monthly',
        productId: params.productId || undefined,
        userId: params.userId || undefined,
        status: params.status || undefined,
      },
      session.user.tenantId
    );

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating profit report:', error);
    return NextResponse.json(
      { error: 'Failed to generate profit report' },
      { status: 500 }
    );
  }
}

function calculateDateRange(period: string, startDateStr?: string, endDateStr?: string) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (period === 'custom' && startDateStr && endDateStr) {
    startDate = new Date(startDateStr);
    endDate = new Date(endDateStr);
  } else {
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
  }

  return { startDate, endDate };
}

function generateTrendData(
  orders: any[],
  profits: any[],
  period: string,
  startDate: Date,
  endDate: Date
) {
  const trends: Array<{
    date: string;
    revenue: number;
    costs: number;
    profit: number;
    orderCount: number;
  }> = [];

  // Group data by date based on period
  const groupedData = new Map<string, {
    revenue: number;
    costs: number;
    profit: number;
    orderCount: number;
  }>();

  orders.forEach((order, index) => {
    const profit = profits[index];
    if (!profit) return;

    const orderDate = new Date(order.createdAt);
    let dateKey: string;

    switch (period) {
      case 'daily':
        dateKey = orderDate.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(orderDate);
        weekStart.setDate(orderDate.getDate() - orderDate.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
      default:
        dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!groupedData.has(dateKey)) {
      groupedData.set(dateKey, {
        revenue: 0,
        costs: 0,
        profit: 0,
        orderCount: 0,
      });
    }

    const data = groupedData.get(dateKey)!;
    data.revenue += profit.revenue;
    data.costs += profit.costs.total;
    data.profit += profit.netProfit;
    data.orderCount += 1;
  });

  // Convert to array and sort by date
  for (const [date, data] of groupedData.entries()) {
    trends.push({
      date,
      ...data,
    });
  }

  trends.sort((a, b) => a.date.localeCompare(b.date));

  return trends;
}