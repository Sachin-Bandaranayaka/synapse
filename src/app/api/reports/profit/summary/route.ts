import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getScopedPrismaClient } from '@/lib/prisma';
import { profitCalculationService } from '@/lib/profit-calculation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'daily':
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
    }

    const prisma = getScopedPrismaClient(session.user.tenantId);

    // Get orders for the period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        costs: true,
        product: true,
        lead: {
          include: {
            batch: true,
          },
        },
      },
    });

    // Calculate profit for each order
    const profitPromises = orders.map(async (order) => {
      try {
        return await profitCalculationService.calculateOrderProfit(order.id, session.user.tenantId);
      } catch (error) {
        console.error(`Error calculating profit for order ${order.id}:`, error);
        return null;
      }
    });

    const profitBreakdowns = (await Promise.all(profitPromises)).filter(Boolean);

    // Calculate summary statistics
    const totalProfit = profitBreakdowns.reduce((sum, profit) => sum + (profit?.netProfit || 0), 0);
    const totalRevenue = profitBreakdowns.reduce((sum, profit) => sum + (profit?.revenue || 0), 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    const profitableOrders = profitBreakdowns.filter(profit => (profit?.netProfit || 0) > 0).length;
    const lowMarginOrders = profitBreakdowns.filter(profit => {
      const margin = profit?.profitMargin || 0;
      return margin >= 0 && margin < 10;
    }).length;
    const lossOrders = profitBreakdowns.filter(profit => (profit?.netProfit || 0) < 0).length;
    
    const avgProfitPerOrder = profitBreakdowns.length > 0 ? totalProfit / profitBreakdowns.length : 0;

    // Calculate trend (simplified - compare with previous period)
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
      include: {
        costs: true,
        product: true,
        lead: {
          include: {
            batch: true,
          },
        },
      },
    });

    const previousProfitPromises = previousOrders.map(async (order) => {
      try {
        return await profitCalculationService.calculateOrderProfit(order.id, session.user.tenantId);
      } catch (error) {
        return null;
      }
    });

    const previousProfitBreakdowns = (await Promise.all(previousProfitPromises)).filter(Boolean);
    const previousTotalProfit = previousProfitBreakdowns.reduce((sum, profit) => sum + (profit?.netProfit || 0), 0);

    let profitTrend: 'up' | 'down' | 'stable' = 'stable';
    let profitTrendPercentage = 0;

    if (previousTotalProfit !== 0) {
      const change = ((totalProfit - previousTotalProfit) / Math.abs(previousTotalProfit)) * 100;
      profitTrendPercentage = Math.abs(change);
      
      if (change > 5) {
        profitTrend = 'up';
      } else if (change < -5) {
        profitTrend = 'down';
      }
    } else if (totalProfit > 0) {
      profitTrend = 'up';
      profitTrendPercentage = 100;
    }

    const summary = {
      totalProfit,
      profitMargin,
      profitableOrders,
      lowMarginOrders,
      lossOrders,
      totalOrders: profitBreakdowns.length,
      avgProfitPerOrder,
      profitTrend,
      profitTrendPercentage,
    };

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating profit summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate profit summary' },
      { status: 500 }
    );
  }
}