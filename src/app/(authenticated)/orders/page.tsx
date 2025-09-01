import { getScopedPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { User } from 'next-auth';
import { OrdersClient } from './orders-client'; // Import our new client component
import { profitCalculationService } from '@/lib/profit-calculation';
import { createPrismaDateFilter, validateDateRange } from '@/lib/date-range-utils';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  const searchQuery = (resolvedSearchParams.query as string) || '';
  const sortParam = (resolvedSearchParams.sort as string) || 'createdAt:desc';
  const profitFilter = (resolvedSearchParams.profitFilter as string) || 'all';
  const startDate = (resolvedSearchParams.startDate as string) || '';
  const endDate = (resolvedSearchParams.endDate as string) || '';

  // Validate date range parameters
  const dateValidation = validateDateRange(startDate || undefined, endDate || undefined);
  if (!dateValidation.isValid) {
    console.warn('Invalid date range parameters:', dateValidation.error);
    // Continue with empty date range if invalid
  }

  if (!session?.user?.tenantId) {
    return redirect('/auth/signin');
  }

  const user = session.user as User;
  const canViewAll = user.role === 'ADMIN' || user.permissions?.includes('VIEW_ORDERS');

  if (!canViewAll) {
    return redirect('/unauthorized');
  }

  const prisma = getScopedPrismaClient(user.tenantId);

  const [sortField, sortDirection] = sortParam.split(':');
  const orderBy = { [sortField]: sortDirection };

  const where: Prisma.OrderWhereInput = {
    ...(!canViewAll && user.role === 'TEAM_MEMBER' ? { userId: user.id } : {}),
    ...(searchQuery ? {
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' } },
        { customerName: { contains: searchQuery, mode: 'insensitive' } },
        { customerPhone: { contains: searchQuery, mode: 'insensitive' } },
        { product: { name: { contains: searchQuery, mode: 'insensitive' } } },
      ],
    } : {}),
    // Date range filtering (only apply if validation passed)
    ...(dateValidation.isValid ? createPrismaDateFilter(startDate || undefined, endDate || undefined) : {}),
  };

  let orders = await prisma.order.findMany({
    where,
    include: { 
      product: true, 
      lead: { include: { batch: true } }, 
      assignedTo: true,
      costs: true
    },
    orderBy,
  });

  // Apply profit-based filtering if specified
  if (profitFilter !== 'all') {
    const ordersWithProfit = await Promise.all(
      orders.map(async (order) => {
        try {
          const profitBreakdown = await profitCalculationService.calculateOrderProfit(order.id, user.tenantId);
          return { order, profit: profitBreakdown };
        } catch (error) {
          console.error(`Error calculating profit for order ${order.id}:`, error);
          return { order, profit: null };
        }
      })
    );

    const filteredOrders = ordersWithProfit.filter(({ profit }) => {
      if (!profit) return false;
      
      switch (profitFilter) {
        case 'excellent':
          return profit.profitMargin >= 30;
        case 'good':
          return profit.profitMargin >= 20 && profit.profitMargin < 30;
        case 'profitable':
          return profit.netProfit > 0;
        case 'low-margin':
          return profit.profitMargin >= 0 && profit.profitMargin < 10;
        case 'loss':
          return profit.netProfit < 0;
        default:
          return true;
      }
    });

    orders = filteredOrders.map(({ order }) => order);
  }

  // Handle profit-based sorting
  if (sortField === 'profitMargin' || sortField === 'netProfit') {
    const ordersWithProfit = await Promise.all(
      orders.map(async (order) => {
        try {
          const profitBreakdown = await profitCalculationService.calculateOrderProfit(order.id, user.tenantId);
          return { order, profit: profitBreakdown };
        } catch (error) {
          return { order, profit: null };
        }
      })
    );

    ordersWithProfit.sort((a, b) => {
      const aValue = a.profit ? (sortField === 'profitMargin' ? a.profit.profitMargin : a.profit.netProfit) : 0;
      const bValue = b.profit ? (sortField === 'profitMargin' ? b.profit.profitMargin : b.profit.netProfit) : 0;
      
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });

    orders = ordersWithProfit.map(({ order }) => order);
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 bg-gray-900">
        {/* Render the new client component with the fetched data */}
        <OrdersClient 
          initialOrders={orders} 
          user={user} 
          searchParams={{
            query: searchQuery,
            startDate,
            endDate,
            preset: (resolvedSearchParams.preset as string) || '',
            profitFilter
          }}
        />
    </div>
  );
}
