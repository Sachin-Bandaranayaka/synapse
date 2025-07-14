'use client';

import { useState } from 'react';
import { User } from 'next-auth';
import { type CourierType, ShippingService } from '@/lib/shipping';

interface OrderActionsProps {
  order: any;
  user: User;
}

export function OrderActions({ order, user }: OrderActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission Checks
  const canEdit = user.role === 'ADMIN' || user.permissions?.includes('EDIT_ORDERS');
  const canUpdateShipping = user.role === 'ADMIN' || user.permissions?.includes('UPDATE_SHIPPING_STATUS');
  const canGenerateInvoice = user.role === 'ADMIN' || user.permissions?.includes('EDIT_ORDERS') || user.permissions?.includes('CREATE_ORDERS');


  const handleStatusUpdate = async (status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipment = async (courier: CourierType) => {
    setIsLoading(true);
    setError(null);

    try {
      const shippingService = ShippingService.getInstance();
      const shipment = await shippingService.createShipment(courier, order);

      await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'SHIPPED',
          shippingId: shipment.trackingNumber,
        }),
      });

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // --- FIX: DEFINING THE MISSING FUNCTION ---
  const handleGenerateInvoice = async () => {
    // This function opens the API route for the invoice in a new browser tab.
    window.open(`/api/orders/${order.id}/invoice`, '_blank');
  };

  return (
    <div className="flex items-center space-x-2">
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="relative inline-block text-left">
        <select
          value={order.status}
          onChange={(e) => handleStatusUpdate(e.target.value)}
          disabled={isLoading || !canEdit}
          className="block w-full rounded-md border-gray-600 bg-gray-700 py-1.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="RETURNED">Returned</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {order.status === 'CONFIRMED' && canUpdateShipping && (
        <div className="relative inline-block text-left ml-2">
          <select
            onChange={(e) => handleShipment(e.target.value as CourierType)}
            disabled={isLoading}
            className="block w-full rounded-md border-gray-600 bg-gray-700 py-1.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">Ship via...</option>
            <option value="FARDA_EXPRESS">Farda Express</option>
            <option value="TRANS_EXPRESS">Trans Express</option>
            <option value="ROYAL_EXPRESS">Royal Express</option>
          </select>
        </div>
      )}
      
      {/* Conditionally render the button based on permission */}
      {canGenerateInvoice && (
        <button
          onClick={handleGenerateInvoice}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          {/* Invoice */}
        </button>
      )}
    </div>
  );
}