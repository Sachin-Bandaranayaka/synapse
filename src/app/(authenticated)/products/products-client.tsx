// src/app/(authenticated)/products/products-client.tsx

'use client';

import { useState } from 'react';
import { ProductList } from '@/components/products/product-list';
import { ProductForm } from '@/components/products/product-form';
import { motion, AnimatePresence } from 'framer-motion';

// This is the Product type passed from the server component
interface Product {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  lowStockAlert: number;
  // Add the new fields to the type definition
  totalOrders: number;
  totalLeads: number;
  lastStockUpdate: string; // <-- Update this from Date to string
}

// The component receives the initial products as a prop
export function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // This function will re-fetch products from the API
  const fetchProducts = async () => {
    setError(null);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    }
  };

  const handleCreateProduct = async (data: any) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }

      setShowCreateForm(false);
      await fetchProducts(); // Refresh the list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import products');
      }
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import products');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage your products, inventory, and pricing
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <label
            htmlFor="csv-upload"
            className={`inline-flex items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 ring-1 ring-white/10-sm hover:bg-gray-600 ${isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isImporting ? 'Importing...' : 'Import CSV'}
            <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleImportCSV} disabled={isImporting} />
          </label>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10-sm hover:bg-indigo-700"
          >
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-900/10 p-4">
          <div className="text-sm text-red-400">{error}</div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showCreateForm ? (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mt-8">
            <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
              <h2 className="text-lg font-medium text-white mb-6">Create New Product</h2>
              <ProductForm onSubmit={handleCreateProduct} onCancel={() => setShowCreateForm(false)} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8">
            {products.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
                <p className="text-gray-400">No products found</p>
                <button onClick={() => setShowCreateForm(true)} className="mt-4 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10-sm hover:bg-indigo-700">
                  Create your first product
                </button>
              </div>
            ) : (
              <div className="bg-gray-800 ring-1 ring-white/10 rounded-lg overflow-hidden">
                <ProductList products={products} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
