// src/app/(authenticated)/orders/orders-client.tsx

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { OrderActions } from '@/components/orders/order-actions';
import { ProfitIndicator, ProfitAlert } from '@/components/orders/profit-indicator';
import { ProfitFilter, ProfitSortOptions } from '@/components/orders/profit-filter';
import { SearchOrders } from '@/components/orders/search-orders';
import { DateRangeFilter } from '@/components/orders/date-range-filter';
import { OrderStatus, Prisma } from '@prisma/client';
import { User } from 'next-auth';

// Define the types for the props this component will receive
type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { product: true; lead: true; assignedTo: true; };
}>;

interface OrdersClientProps {
  initialOrders: OrderWithRelations[];
  user: User;
  searchParams?: {
    query?: string;
    startDate?: string;
    endDate?: string;
    preset?: string;
    profitFilter?: string;
  };
}

export function OrdersClient({ initialOrders, user, searchParams }: OrdersClientProps) {
  // State to keep track of which order IDs are selected
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isPending] = useTransition();

  // Group orders by status
  const ordersByStatus = initialOrders.reduce((acc, order) => {
    const status = order.status.toLowerCase();
    if (!acc[status]) acc[status] = [];
    acc[status].push(order);
    return acc;
  }, {} as Record<string, OrderWithRelations[]>);

  const statusOrder = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.RETURNED, OrderStatus.CANCELLED];
  
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-400', confirmed: 'bg-blue-400', shipped: 'bg-purple-400',
      delivered: 'bg-green-400', returned: 'bg-red-400', cancelled: 'bg-gray-400',
    };
    return colors[status.toLowerCase() as keyof typeof colors] || colors.pending;
  };

  // Handler for changing a single checkbox's state
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId) // Uncheck: remove from array
        : [...prev, orderId] // Check: add to array
    );
  };

  // --- NEW: Handler for the "Select All" checkbox in each section ---
  const handleSelectAllByStatus = (ordersInSection: OrderWithRelations[]) => {
    const orderIdsInSection = ordersInSection.map(order => order.id);
    // Check if all orders in this section are already selected
    const allSelected = orderIdsInSection.every(id => selectedOrders.includes(id));

    if (allSelected) {
      // If all are selected, deselect them
      setSelectedOrders(prev => prev.filter(id => !orderIdsInSection.includes(id)));
    } else {
      // Otherwise, select all (ensuring no duplicates)
      setSelectedOrders(prev => [...new Set([...prev, ...orderIdsInSection])]);
    }
  };

  const canPrintInvoices = user.role === 'ADMIN' || user.permissions?.includes('CREATE_ORDERS') || user.permissions?.includes('EDIT_ORDERS');

  return (
    <>
      {isPending && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-300">Filtering orders...</span>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Orders</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage and track your orders with profit insights
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <SearchOrders />
            <DateRangeFilter />
            <ProfitFilter />
            <ProfitSortOptions />
          </div>
          
          {canPrintInvoices && (
            <Link
              href={selectedOrders.length > 0 ? `/orders/print?ids=${selectedOrders.join(',')}` : '#'}
              aria-disabled={selectedOrders.length === 0}
              className={`inline-flex items-center px-4 py-2 border rounded-md ring-1 text-sm font-medium transition-colors ${
                selectedOrders.length === 0
                  ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 ring-white/10'
              }`}
              onClick={(e) => {
                if (selectedOrders.length === 0) e.preventDefault();
              }}
            >
              Print Selected ({selectedOrders.length})
            </Link>
          )}
        </div>
      </div>

      {initialOrders.length === 0 ? (
        <div className="bg-gray-800 rounded-lg ring-1 ring-white/10 p-6 text-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-300 font-medium">No orders found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchParams?.startDate || searchParams?.endDate || searchParams?.preset
                  ? 'No orders found for the selected date range. Try adjusting your date filter or clearing it to see all orders.'
                  : searchParams?.query
                  ? 'No orders match your search criteria. Try different keywords or clear your search.'
                  : searchParams?.profitFilter && searchParams.profitFilter !== 'all'
                  ? 'No orders match the selected profit filter. Try adjusting your profit criteria.'
                  : 'Get started by creating your first order.'}
              </p>
            </div>
            {(searchParams?.startDate || searchParams?.endDate || searchParams?.preset || searchParams?.query || (searchParams?.profitFilter && searchParams.profitFilter !== 'all')) && (
              <button
                onClick={() => window.location.href = '/orders'}
                className="mt-2 px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-600 hover:border-indigo-500 rounded-md transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.map(statusEnum => {
            const status = statusEnum.toLowerCase();
            const statusOrders = ordersByStatus[status] || [];
            if (statusOrders.length === 0) return null;

            // --- NEW: Check if all orders in this section are selected ---
            const areAllInSectionSelected = statusOrders.every(order => selectedOrders.includes(order.id));

            return (
              <div key={status} className="bg-gray-800 rounded-lg ring-1 ring-white/10">
                {/* --- UPDATED: Section header now includes the "Select All" checkbox --- */}
                <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-white flex items-center space-x-3">
                    <span className={`inline-block rounded-full w-3 h-3 ${getStatusColor(status)}`}></span>
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)} Orders ({statusOrders.length})</span>
                  </h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                      onChange={() => handleSelectAllByStatus(statusOrders)}
                      checked={areAllInSectionSelected}
                    />
                    <label className="text-sm text-gray-400">Select All</label>
                  </div>
                </div>
                <ul className="divide-y divide-gray-700">
                  {statusOrders.map((order) => (
                    <li key={order.id} className="hover:bg-gray-700/50 flex items-center px-6 py-4">
                      <div className="mr-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-3">
                              <Link href={`/orders/${order.id}`} className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
                                Order #{order.id.slice(0, 8)}
                              </Link>
                              <ProfitIndicator orderId={order.id} size="sm" />
                            </div>
                            <p className="text-sm text-gray-400">{order.product.name} • {order.customerName}</p>
                            {order.total > 0 && (
                              <p className="text-sm text-gray-400">LKR {order.total.toFixed(2)}</p>
                            )}
                            <ProfitAlert orderId={order.id} />
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                              {order.assignedTo && <p className="mt-1 text-sm text-gray-400">Assigned to: {order.assignedTo.name}</p>}
                            </div>
                            <OrderActions order={order} user={user} />
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
    </>
  );
}
