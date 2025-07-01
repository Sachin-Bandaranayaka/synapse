'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
}

interface StockAdjustment {
  id: string;
  quantity: number;
  reason: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
  adjustedBy: {
    name: string | null;
    email: string;
  };
}

interface StockHistoryProps {
  products: Product[];
}

export function StockHistory({ products }: StockHistoryProps) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [history, setHistory] = useState<StockAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      fetchHistory();
    }
  }, [selectedProduct]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory/${selectedProduct}/history`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock history');
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-600 mb-4">{error}</div>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading history...</div>
      ) : selectedProduct && history.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {history.map((adjustment) => (
              <li key={adjustment.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-indigo-600">
                    {adjustment.quantity > 0 ? 'Added' : 'Removed'}{' '}
                    {Math.abs(adjustment.quantity)} units
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(adjustment.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-gray-900">
                    Reason: {adjustment.reason}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Stock changed from {adjustment.previousStock} to{' '}
                    {adjustment.newStock}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Adjusted by: {adjustment.adjustedBy.name || adjustment.adjustedBy.email}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : selectedProduct ? (
        <div className="text-sm text-gray-500">No history available</div>
      ) : null}
    </div>
  );
}
