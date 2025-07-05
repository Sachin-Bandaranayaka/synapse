'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { User } from 'next-auth'; // --- FIX: Import the User type

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  lowStockAlert: number;
  totalOrders: number;
  totalLeads: number;
  lastStockUpdate: string;
}

// --- FIX: Update props to accept the user object ---
interface ProductListProps {
  products: Product[];
  user: User;
}

export function ProductList({ products, user }: ProductListProps) {
  const [sortField, setSortField] = useState<keyof Product>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- FIX: Add permission checks based on the user prop ---
  const canEdit = user.role === 'ADMIN' || user.permissions?.includes('EDIT_PRODUCTS');
  const canDelete = user.role === 'ADMIN' || user.permissions?.includes('DELETE_PRODUCTS');

  const sortedProducts = [...products].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * direction;
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * direction;
    }
    return 0;
  });

  const handleSort = (field: keyof Product) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStockStatusColor = (stock: number, lowStockAlert: number) => {
    if (stock === 0) return 'bg-red-900/50 text-red-300 ring-red-500/50';
    if (stock <= lowStockAlert) return 'bg-yellow-900/50 text-yellow-300 ring-yellow-500/50';
    return 'bg-green-900/50 text-green-300 ring-green-500/50';
  };

  const deleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      console.error('Error deleting product:', err);
    }
  };

  return (
    <div className="overflow-x-auto">
      {error && (
        <div className="mb-4 rounded-md bg-red-900/50 p-4">
          <div className="text-sm text-red-300">{error}</div>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th onClick={() => handleSort('code')} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300">
              Code {sortField === 'code' && (<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
            </th>
            <th onClick={() => handleSort('name')} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300">
              Name {sortField === 'name' && (<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
            </th>
            <th onClick={() => handleSort('price')} className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300">
              Price {sortField === 'price' && (<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
            </th>
            <th onClick={() => handleSort('stock')} className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-300">
              Stock {sortField === 'stock' && (<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Activity</th>
            {/* --- FIX: Only show the Actions header if user has permission --- */}
            {(canEdit || canDelete) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedProducts.map((product) => (
            <motion.tr
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="hover:bg-gray-700/50"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{product.code}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-white">{product.name}</div>
                  {product.description && (<div className="text-sm text-gray-400">{product.description}</div>)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-100">
                {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(product.price)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStockStatusColor(product.stock, product.lowStockAlert)}`}>
                  {product.stock}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400">
                {product.totalOrders} orders, {product.totalLeads} leads
                <div className="text-xs">
                  Last updated: {format(new Date(product.lastStockUpdate), 'MMM d, yyyy')}
                </div>
              </td>
              {/* --- FIX: Conditionally render the entire actions cell --- */}
              {(canEdit || canDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-3">
                  {canEdit && (
                    <Link href={`/products/${product.id}/edit`} className="text-indigo-400 hover:text-indigo-300">
                      Edit
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this product? This will also delete all associated leads and orders.')) {
                          deleteProduct(product.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}