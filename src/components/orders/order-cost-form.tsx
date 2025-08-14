'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PackagingCostTooltip, PrintingCostTooltip, ReturnCostTooltip } from '@/components/ui/tooltip';

interface OrderCostFormProps {
  orderId: string;
  onCostUpdate?: (costs: OrderCostUpdate) => void;
  initialCosts?: {
    packagingCost: number;
    printingCost: number;
    returnCost: number;
  };
  showReturnCost?: boolean;
  disabled?: boolean;
}

interface OrderCostUpdate {
  packagingCost?: number;
  printingCost?: number;
  returnCost?: number;
}

export function OrderCostForm({
  orderId,
  onCostUpdate,
  initialCosts,
  showReturnCost = false,
  disabled = false
}: OrderCostFormProps) {
  const [costs, setCosts] = useState({
    packagingCost: initialCosts?.packagingCost || 0,
    printingCost: initialCosts?.printingCost || 0,
    returnCost: initialCosts?.returnCost || 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialCosts) {
      setCosts({
        packagingCost: initialCosts.packagingCost || 0,
        printingCost: initialCosts.printingCost || 0,
        returnCost: initialCosts.returnCost || 0,
      });
    }
  }, [initialCosts]);

  const handleCostChange = (field: keyof typeof costs, value: string) => {
    // Clear previous messages
    setSuccess(false);
    setError(null);

    // Handle empty input
    if (value === '') {
      setCosts(prev => ({
        ...prev,
        [field]: 0
      }));
      return;
    }

    // Validate numeric input
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError(`${field} must be a valid number`);
      return;
    }

    // Prevent negative values
    if (numValue < 0) {
      setError(`${field} cannot be negative`);
      return;
    }

    // Warn about unusually high values
    const warningThresholds = {
      packagingCost: 100,
      printingCost: 50,
      returnCost: 1000
    };

    if (numValue > warningThresholds[field]) {
      console.warn(`High ${field} detected: $${numValue}. Please verify this amount is correct.`);
    }

    setCosts(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate costs before sending
      const costUpdate: OrderCostUpdate = {
        packagingCost: costs.packagingCost,
        printingCost: costs.printingCost,
      };

      if (showReturnCost) {
        costUpdate.returnCost = costs.returnCost;
      }

      // Client-side validation
      const hasInvalidCosts = Object.entries(costUpdate).some(([key, value]) => {
        if (value === undefined) return false;
        return value < 0 || !isFinite(value);
      });

      if (hasInvalidCosts) {
        throw new Error('Please ensure all cost values are valid positive numbers');
      }

      const response = await fetch(`/api/orders/${orderId}/costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(costUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error types
        if (response.status === 400) {
          if (errorData.details && Array.isArray(errorData.details)) {
            const fieldErrors = errorData.details.map((detail: any) =>
              `${detail.field}: ${detail.message}`
            ).join(', ');
            throw new Error(`Validation errors: ${fieldErrors}`);
          }
          throw new Error(errorData.error || 'Invalid cost data provided');
        }

        if (response.status === 403) {
          throw new Error('You do not have permission to update order costs');
        }

        if (response.status === 404) {
          throw new Error('Order not found. It may have been deleted.');
        }

        throw new Error(errorData.error || 'Failed to update costs');
      }

      const updatedBreakdown = await response.json();

      // Validate response
      if (!updatedBreakdown || typeof updatedBreakdown !== 'object') {
        throw new Error('Invalid response received from server');
      }

      setSuccess(true);

      if (onCostUpdate) {
        onCostUpdate(costUpdate);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update costs';
      setError(errorMessage);
      console.error('Cost update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-gray-800 border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="packagingCost" className="text-sm font-medium text-gray-300 flex items-center space-x-2">
              <span>Packaging Cost ($)</span>
              <PackagingCostTooltip />
            </Label>
            <Input
              id="packagingCost"
              type="number"
              step="0.01"
              min="0"
              value={costs.packagingCost}
              onChange={(e) => handleCostChange('packagingCost', e.target.value)}
              disabled={disabled || isLoading}
              className="mt-1 bg-gray-700 border-gray-600 text-white"
              placeholder="Enter packaging materials cost"
            />
          </div>

          <div>
            <Label htmlFor="printingCost" className="text-sm font-medium text-gray-300 flex items-center space-x-2">
              <span>Printing Cost ($)</span>
              <PrintingCostTooltip />
            </Label>
            <Input
              id="printingCost"
              type="number"
              step="0.01"
              min="0"
              value={costs.printingCost}
              onChange={(e) => handleCostChange('printingCost', e.target.value)}
              disabled={disabled || isLoading}
              className="mt-1 bg-gray-700 border-gray-600 text-white"
              placeholder="Enter printing materials cost"
            />
          </div>

          {showReturnCost && (
            <div className="md:col-span-2">
              <Label htmlFor="returnCost" className="text-sm font-medium text-gray-300 flex items-center space-x-2">
                <span>Return Shipping Cost ($)</span>
                <ReturnCostTooltip />
              </Label>
              <Input
                id="returnCost"
                type="number"
                step="0.01"
                min="0"
                value={costs.returnCost}
                onChange={(e) => handleCostChange('returnCost', e.target.value)}
                disabled={disabled || isLoading}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                placeholder="Enter return processing cost"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-400 text-sm bg-green-900/20 p-2 rounded">
            Costs updated successfully!
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={disabled || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Updating...' : 'Update Costs'}
          </Button>
        </div>
      </form>
    </Card>
  );
}