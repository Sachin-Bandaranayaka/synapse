import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date and 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User Growth - users created in the last 30 days
    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Tenant Activity - active tenants
    const totalTenants = await prisma.tenant.count();
    const activeTenants = await prisma.tenant.count({
      where: {
        isActive: true
      }
    });

    // System Performance (mock data for now)
    const systemPerformance = {
      cpu: 45,
      memory: 68,
      storage: 32,
      uptime: 98.5
    };

    // Revenue Metrics - sum of order totals
    const revenueMetrics = await prisma.order.aggregate({
      _sum: {
        total: true
      },
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        },
        status: 'DELIVERED'
      }
    });

    // Usage Statistics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true
      }
    });

    const totalOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Error Rates (mock data)
    const errorRates = {
      rate: 0.02,
      status: 'excellent',
      lastUpdated: now
    };

    const analytics = {
      userGrowth: userGrowth.map(item => ({
        date: item.createdAt,
        count: item._count.id
      })),
      tenantActivity: {
        total: totalTenants,
        active: activeTenants,
        percentage: totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0
      },
      systemPerformance,
      revenueMetrics: {
        total: revenueMetrics._sum?.total || 0,
        currency: 'USD'
      },
      usageStats: {
        totalUsers,
        activeUsers,
        totalTenants,
        totalOrders,
        uptime: systemPerformance.uptime
      },
      errorRates
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}