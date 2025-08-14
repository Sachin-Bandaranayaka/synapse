'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from 'next-auth'; // Import the User type from next-auth
import { CostPriceTooltip } from '@/components/ui/tooltip';

const productSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be less than 50 characters'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  price: z.number()
    .min(0, 'Price must be greater than or equal to 0')
    .max(1000000, 'Price must be less than 1,000,000'),
  costPrice: z.number()
    .min(0, 'Cost price must be greater than or equal to 0')
    .max(1000000, 'Cost price must be less than 1,000,000'),
  stock: z.number()
    .min(0, 'Stock must be greater than or equal to 0')
    .max(100000, 'Stock must be less than 100,000'),
  lowStockAlert: z.number()
    .min(0, 'Low stock alert must be greater than or equal to 0')
    .max(100000, 'Low stock alert must be less than 100,000'),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price: number;
  costPrice: number;
  stock: number;
  lowStockAlert: number;
}

// --- FIX: The component now requires the full user object ---
interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  user: User; // The user object from the session
}

export function ProductForm({ product, onSubmit, onCancel, user }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- FIX: Derive the permission directly inside the component ---
  // An Admin can ALWAYS edit stock. A team member can only edit if they have the specific permission.
  const canEditStock = user.role === 'ADMIN' || (user.permissions && user.permissions.includes('EDIT_STOCK_LEVELS'));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      code: product.code,
      name: product.name,
      description: product.description || '',
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      lowStockAlert: product.lowStockAlert,
    } : {
      code: '',
      name: '',
      description: '',
      price: 0,
      costPrice: 0,
      stock: 0,
      lowStockAlert: 5,
    },
  });

  const onSubmitForm = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // If a user (who is not an admin) can't edit stock, revert to the original value.
      // This logic is now more robust.
      if (!canEditStock && product) {
        data.stock = product.stock;
      }
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-md bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500"
        >
          {error}
        </motion.div>
      )}

      {/* Other form fields remain the same */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-100">Code</label>
          <input
            type="text"
            id="code"
            {...register('code')}
            disabled={!!product}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {errors.code && <p className="mt-1 text-sm text-red-400">{errors.code.message}</p>}
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-100">Name</label>
          <input
            type="text"
            id="name"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-100">Description</label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>}
        </div>

        {/* The stock input field */}
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-100">
            Stock
          </label>
          <input
            type="number"
            id="stock"
            {...register('stock', { valueAsNumber: true })}
            // --- FIX: The disabled logic now correctly handles Admins ---
            // It's disabled if the user is NOT allowed to edit stock AND it's an existing product.
            // For new products, it's always enabled.
            disabled={!canEditStock && !!product}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {!canEditStock && !!product && (
            <p className="mt-1 text-sm text-yellow-400">You don't have permission to change the stock of existing products.</p>
          )}
          {errors.stock && (
            <p className="mt-1 text-sm text-red-400">{errors.stock.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-100">Price (LKR)</label>
          <input
            type="number"
            id="price"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.price && <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>}
        </div>
        <div>
          <label htmlFor="costPrice" className="block text-sm font-medium text-gray-100 flex items-center space-x-2">
            <span>Cost Price (LKR)</span>
            <CostPriceTooltip />
          </label>
          <input
            type="number"
            id="costPrice"
            step="0.01"
            {...register('costPrice', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter the actual cost you paid for this product"
          />
          {errors.costPrice && <p className="mt-1 text-sm text-red-400">{errors.costPrice.message}</p>}
        </div>
        <div>
          <label htmlFor="lowStockAlert" className="block text-sm font-medium text-gray-100">Low Stock Alert</label>
          <input
            type="number"
            id="lowStockAlert"
            {...register('lowStockAlert', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.lowStockAlert && <p className="mt-1 text-sm text-red-400">{errors.lowStockAlert.message}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <motion.button type="button" onClick={onCancel} className="inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600">
          Cancel
        </motion.button>
        <motion.button type="submit" disabled={isSubmitting} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {isSubmitting ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
        </motion.button>
      </div>
    </form>
  );
}