'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OrderActions } from '@/components/orders/order-actions';
import { OrderStatus, Prisma } from '@prisma/client';
import { User } from 'next-auth';

// Define the types for the props this component will receive
type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { product: true; lead: true; assignedTo: true; };
}>;

interface OrdersClientProps {
  initialOrders: OrderWithRelations[];
  user: User;
}

export function OrdersClient({ initialOrders, user }: OrdersClientProps) {
  // State to keep track of which order IDs are selected
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Group orders by status (this logic is moved from the server component)
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

  // Handler for changing a checkbox's state
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId) // Uncheck: remove from array
        : [...prev, orderId] // Check: add to array
    );
  };

  const canPrintInvoices = user.role === 'ADMIN' || user.permissions?.includes('CREATE_ORDERS') || user.permissions?.includes('EDIT_ORDERS');

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* This part remains the same, but we add the new button */}
        <div>
          {/* Header text... */}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Search and Sort components would go here */}

            {/* --- NEW: "Print Selected" Button --- */}
            {/* It's a Link that navigates to a new print page. */}
            {/* It's disabled if no orders are selected. */}
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

      {/* The rest of the rendering logic is the same, but with checkboxes added */}
      {initialOrders.length === 0 ? (
        <div className="bg-gray-800 rounded-lg ring-1 ring-white/10 p-6 text-center">
          <p className="text-gray-400">No orders found</p>
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
                    <li key={order.id} className="hover:bg-gray-700/50 flex items-center px-6 py-4">
                      {/* --- NEW: Checkbox for each order --- */}
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
                          <div className="flex flex-col">
                            <Link href={`/orders/${order.id}`} className="text-sm font-medium text-indigo-400 hover:text-indigo-300">Order #{order.id.slice(0, 8)}</Link>
                            <p className="mt-1 text-sm text-gray-400">{order.product.name} • {order.customerName}</p>
                            {order.total > 0 && (<p className="text-sm text-gray-400">LKR {order.total.toFixed(2)}</p>)}
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
