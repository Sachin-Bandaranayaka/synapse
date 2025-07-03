// src/app/(authenticated)/orders/page.tsx

import { getScopedPrismaClient } from '@/lib/prisma'; // <-- KEY CHANGE
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OrderActions } from '@/components/orders/order-actions';
import { SearchOrders } from '@/components/orders/search-orders';
import { SortOrders } from '@/components/orders/sort-orders';
import Link from 'next/link';
import { OrderStatus, Prisma } from '@prisma/client';

// Keep types the same

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { product: true; lead: true; assignedTo: true; };
}>;

type OrdersByStatus = { [key: string]: OrderWithRelations[] };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);
  const searchQuery = (searchParams.query as string) || '';
  const sortParam = (searchParams.sort as string) || 'createdAt:desc';

  // 1. SECURE THE PAGE: Check for session and tenantId
  if (!session?.user?.tenantId) {
    return redirect('/auth/signin');
  }

  // 2. USE THE SCOPED CLIENT
  const prisma = getScopedPrismaClient(session.user.tenantId);

  // 3. BUILD SECURE & EFFICIENT PRISMA QUERY
  const [sortField, sortDirection] = sortParam.split(':');
  const orderBy = { [sortField]: sortDirection };

  const where: Prisma.OrderWhereInput = {
    // Role-based filtering (tenant is handled by scoped client)
    ...(session.user.role === 'TEAM_MEMBER' && { userId: session.user.id }),
    // Search filtering (now done in the database)
    ...(searchQuery && {
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' } },
        { customerName: { contains: searchQuery, mode: 'insensitive' } },
        { customerPhone: { contains: searchQuery, mode: 'insensitive' } },
        { product: { name: { contains: searchQuery, mode: 'insensitive' } } },
      ],
    }),
  };

  // 4. FETCH SECURE DATA: This query is now filtered and sorted by the database
  const orders = await prisma.order.findMany({
    where,
    include: { product: true, lead: true, assignedTo: true, },
    orderBy,
  });

  // Group the secure results
  const ordersByStatus = orders.reduce((acc: OrdersByStatus, order) => {
    const status = order.status.toLowerCase();
    if (!acc[status]) acc[status] = [];
    acc[status].push(order);
    return acc;
  }, {});
  
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-400', confirmed: 'bg-blue-400', shipped: 'bg-purple-400',
      delivered: 'bg-green-400', returned: 'bg-red-400', cancelled: 'bg-gray-400',
    };
    return colors[status.toLowerCase() as keyof typeof colors] || colors.pending;
  };
  const statusOrder = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.RETURNED, OrderStatus.CANCELLED];

  // The rendering part remains the same
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 bg-gray-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Orders</h1>
          <p className="mt-2 text-sm text-gray-400">Manage orders and track their status {searchQuery && `• Searching: "${searchQuery}"`}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <SearchOrders />
          <SortOrders />
          <Link href="/orders/print" className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md ring-1 ring-white/10 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700">Print Invoices</Link>
        </div>
      </div>
      {orders.length === 0 ? (
        <div className="bg-gray-800 rounded-lg ring-1 ring-white/10 p-6 text-center">
          <p className="text-gray-400">No orders found {searchQuery && `matching "${searchQuery}"`}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.map(statusEnum => {
            const status = statusEnum.toLowerCase();
            const statusOrders = ordersByStatus[status] || [];
            if (statusOrders.length === 0) return null;
            return (
              <div key={status} className="bg-gray-800 rounded-lg ring-1 ring-white/10">
                <div className="px-6 py-4 border-b border-gray-700">
                  <h2 className="text-lg font-medium text-white flex items-center space-x-3">
                    <span className={`inline-block rounded-full w-3 h-3 ${getStatusColor(status)}`}></span>
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)} Orders ({statusOrders.length})</span>
                  </h2>
                </div>
                <ul className="divide-y divide-gray-700">
                  {statusOrders.map((order) => (
                    <li key={order.id} className="hover:bg-gray-700/50">
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <Link href={`/orders/${order.id}`} className="text-sm font-medium text-indigo-400 hover:text-indigo-300">Order #{order.id.slice(0, 8)}</Link>
                            <p className="mt-1 text-sm text-gray-400">{order.product.name} • {order.customerName}</p>
                            {order.total > 0 && (<p className="text-sm text-gray-400">LKR {order.total.toFixed(2)}</p>)}
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                              <p className="mt-1 text-sm text-gray-400">Assigned to: {order.assignedTo.name}</p>
                            </div>
                            <OrderActions order={order} />
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
