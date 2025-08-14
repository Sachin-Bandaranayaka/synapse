// src/components/settings/cost-configuration-form.tsx

'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface CostConfiguration {
  packagingCost: number;
  printingCost: number;
  returnCost: number;
}

interface CostConfigurationFormProps {
  tenantId: string;
}

export function CostConfigurationForm({ tenantId }: CostConfigurationFormProps) {
  const [config, setConfig] = useState<CostConfiguration>({
    packagingCost: 0,
    printingCost: 0,
    returnCost: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCostConfiguration();
  }, [tenantId]);

  const fetchCostConfiguration = async () => {
    try {
      const response = await fetch('/api/tenant/cost-config');
      if (response.ok) {
        const data = await response.json();
        setConfig({
          packagingCost: data.packagingCost || 0,
          printingCost: data.printingCost || 0,
          returnCost: data.returnCost || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching cost configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cost configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/tenant/cost-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defaultPackagingCost: config.packagingCost,
          defaultPrintingCost: config.printingCost,
          defaultReturnCost: config.returnCost,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Cost configuration updated successfully',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Error updating cost configuration:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update cost configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CostConfiguration, value: string) => {
    const numericValue = parseFloat(value) || 0;
    if (numericValue >= 0) {
      setConfig(prev => ({
        ...prev,
        [field]: numericValue,
      }));
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white">Default Cost Configuration</h3>
        <p className="mt-1 text-sm text-gray-400">
          Set default costs that will be automatically applied to new orders. These can be overridden on individual orders.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
        <div>
          <label htmlFor="packagingCost" className="block text-sm font-medium text-gray-300">
            Default Packaging Cost
          </label>
          <p className="mt-1 text-xs text-gray-400">Cost per order for packaging materials</p>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              id="packagingCost"
              min="0"
              step="0.01"
              value={config.packagingCost}
              onChange={(e) => handleInputChange('packagingCost', e.target.value)}
              className="pl-8 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="printingCost" className="block text-sm font-medium text-gray-300">
            Default Printing Cost
          </label>
          <p className="mt-1 text-xs text-gray-400">Cost per order for printing invoices/labels</p>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              id="printingCost"
              min="0"
              step="0.01"
              value={config.printingCost}
              onChange={(e) => handleInputChange('printingCost', e.target.value)}
              className="pl-8 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="returnCost" className="block text-sm font-medium text-gray-300">
            Default Return Cost
          </label>
          <p className="mt-1 text-xs text-gray-400">Default cost for processing returns</p>
          <div className="mt-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              id="returnCost"
              min="0"
              step="0.01"
              value={config.returnCost}
              onChange={(e) => handleInputChange('returnCost', e.target.value)}
              className="pl-8 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Cost Configuration'}
        </button>
      </div>
    </form>
  );
}