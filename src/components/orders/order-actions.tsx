'use client';

import { useState } from 'react';
import { User } from 'next-auth';
import { type CourierType, ShippingService } from '@/lib/shipping';
import { OrderCostForm } from './order-cost-form';
import { Button } from '@/components/ui/button';

interface OrderActionsProps {
  order: any;
  user: User;
}

export function OrderActions({ order, user }: OrderActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCostForm, setShowCostForm] = useState(false);
  const [returnCost, setReturnCost] = useState<number>(0);
  const [showReturnCostModal, setShowReturnCostModal] = useState(false);
  const [returnCostError, setReturnCostError] = useState<string | null>(null);

  // Permission Checks
  const canEdit = user.role === 'ADMIN' || user.permissions?.includes('EDIT_ORDERS');
  const canUpdateShipping = user.role === 'ADMIN' || user.permissions?.includes('UPDATE_SHIPPING_STATUS');
  const canGenerateInvoice = user.role === 'ADMIN' || user.permissions?.includes('EDIT_ORDERS') || user.permissions?.includes('CREATE_ORDERS');


  const handleStatusUpdate = async (status: string) => {
    // If changing to RETURNED, show return cost modal first
    if (status === 'RETURNED' && order.status !== 'RETURNED') {
      setShowReturnCostModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const body: any = { status };
      
      // Include return cost if changing to RETURNED
      if (status === 'RETURNED' && returnCost > 0) {
        body.returnCost = returnCost;
      }

      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const handleReturnWithCost = async () => {
    // Validate return cost
    setReturnCostError(null);
    
    if (returnCost < 0) {
      setReturnCostError('Return cost cannot be negative');
      return;
    }
    
    // Business rule: Return cost should be reasonable (not more than 10x the order total)
    if (returnCost > order.total * 10) {
      setReturnCostError('Return cost seems unusually high. Please verify the amount.');
      return;
    }
    
    setShowReturnCostModal(false);
    await handleStatusUpdate('RETURNED');
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
    <div className="space-y-4">
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
            Invoice
          </button>
        )}

        {/* Cost Management Button */}
        {canEdit && (
          <Button
            onClick={() => setShowCostForm(!showCostForm)}
            variant="outline"
            size="sm"
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            {showCostForm ? 'Hide Costs' : 'Manage Costs'}
          </Button>
        )}
      </div>

      {/* Cost Form */}
      {showCostForm && canEdit && (
        <OrderCostForm
          orderId={order.id}
          onCostUpdate={() => {
            // Refresh the page or update the order data
            window.location.reload();
          }}
          showReturnCost={order.status === 'RETURNED'}
        />
      )}

      {/* Return Cost Modal */}
      {showReturnCostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">Process Return</h3>
            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-2">
                Order Total: <span className="font-medium text-white">${order.total.toFixed(2)}</span>
              </p>
              <p className="text-gray-300 text-sm mb-4">
                Please enter the return shipping cost for this order:
              </p>
            </div>
            
            <div className="mb-4">
              <input
                type="number"
                step="0.01"
                min="0"
                value={returnCost}
                onChange={(e) => {
                  setReturnCost(parseFloat(e.target.value) || 0);
                  setReturnCostError(null);
                }}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="0.00"
                autoFocus
              />
              {returnCostError && (
                <p className="text-red-400 text-xs mt-1">{returnCostError}</p>
              )}
            </div>

            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3 mb-4">
              <p className="text-yellow-300 text-xs">
                <strong>Note:</strong> Processing this return will:
                <br />• Restore {order.quantity} unit(s) to inventory
                <br />• Update profit calculation with return cost
                <br />• Mark order as RETURNED (cannot be undone)
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setShowReturnCostModal(false);
                  setReturnCostError(null);
                  setReturnCost(0);
                }}
                variant="outline"
                className="text-gray-300 border-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturnWithCost}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={returnCost < 0}
              >
                Process Return
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}