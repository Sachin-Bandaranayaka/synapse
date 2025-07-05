// src/components/inventory/stock-adjustment-form.tsx

'use client';

import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  stock: number;
}

interface StockAdjustmentFormProps {
  product: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StockAdjustmentForm({ product, onSuccess, onCancel }: StockAdjustmentFormProps) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: parseInt(quantity),
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to adjust stock');
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-400">Current stock for {product.name}: {product.stock}</p>
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-400">Quantity Change</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          placeholder="e.g., -5 or 10"
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white ring-1 ring-white/10 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-400">Reason</label>
        <input
          type="text"
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          placeholder="e.g., Damaged goods, Stock count correction"
          className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white ring-1 ring-white/10 focus:ring-indigo-500"
        />
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600">Cancel</button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Adjusting...' : 'Adjust Stock'}
        </button>
      </div>
    </form>
  );
}