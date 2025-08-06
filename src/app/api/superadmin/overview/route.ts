import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant statistics
    const [totalTenants, activeTenants] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({
        where: { isActive: true },
      }),
    ]);

    // Get user statistics
    const [totalUsers, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { isActive: true },
      }),
    ]);

    // Get recent tenants (last 5)
    const recentTenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Get recent users (last 5)
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    const stats = {
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      recentTenants,
      recentUsers,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}