'use client';

import { useState } from 'react';
import { ShippingService, type CourierType } from '@/lib/shipping';

interface OrderActionsProps {
  order: any;
}

export function OrderActions({ order }: OrderActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusUpdate = async (status: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
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

  const handleGenerateInvoice = async () => {
    window.open(`/api/orders/${order.id}/invoice`, '_blank');
  };

  return (
    <div className="flex items-center space-x-2">
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="relative inline-block text-left">
        <select
          value={order.status}
          onChange={(e) => handleStatusUpdate(e.target.value)}
          disabled={isLoading}
          className="block w-full rounded-md border-gray-600 bg-gray-700 py-1.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
        >
          <option key="pending" value="PENDING">Pending</option>
          <option key="confirmed" value="CONFIRMED">Confirmed</option>
          <option key="shipped" value="SHIPPED">Shipped</option>
          <option key="delivered" value="DELIVERED">Delivered</option>
          <option key="returned" value="RETURNED">Returned</option>
          <option key="cancelled" value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {order.status === 'CONFIRMED' && (
        <div className="relative inline-block text-left ml-2">
          <select
            onChange={(e) => handleShipment(e.target.value as CourierType)}
            disabled={isLoading}
            className="block w-full rounded-md border-gray-600 bg-gray-700 py-1.5 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option key="empty" value="">Ship via...</option>
            <option key="farda" value="FARDA_EXPRESS">Farda Express</option>
            <option key="trans" value="TRANS_EXPRESS">Trans Express</option>
            <option key="royal" value="ROYAL_EXPRESS">Royal Express</option>
          </select>
        </div>
      )}

      <button
        onClick={handleGenerateInvoice}
        className="text-blue-400 hover:text-blue-300"
      >
        Generate Invoice
      </button>
    </div>
  );
}
