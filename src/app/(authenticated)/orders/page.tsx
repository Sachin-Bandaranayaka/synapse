import { getScopedPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { User } from 'next-auth';
import { OrdersClient } from './orders-client'; // Import our new client component
import { SearchOrders } from '@/components/orders/search-orders';
import { SortOrders } from '@/components/orders/sort-orders';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  const searchQuery = (resolvedSearchParams.query as string) || '';
  const sortParam = (resolvedSearchParams.sort as string) || 'createdAt:desc';

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
  };

  const orders = await prisma.order.findMany({
    where,
    include: { product: true, lead: true, assignedTo: true },
    orderBy,
  });

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 bg-gray-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-semibold text-white">Orders</h1>
                <p className="mt-2 text-sm text-gray-400">Manage orders and track their status {searchQuery && `• Searching: "${searchQuery}"`}</p>
            </div>
            {/* The Search and Sort components can remain here if they use URL params */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <SearchOrders />
                <SortOrders />
            </div>
        </div>
        
        {/* Render the new client component with the fetched data */}
        <OrdersClient initialOrders={orders} user={user} />
    </div>
  );
}
