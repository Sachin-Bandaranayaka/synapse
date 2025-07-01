'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { motion } from 'framer-motion';

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
  stock: number;
  lowStockAlert: number;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  canEditStock?: boolean;
}

export function ProductForm({ product, onSubmit, onCancel, canEditStock = false }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStockWarning, setShowStockWarning] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      code: product.code,
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      lowStockAlert: product.lowStockAlert,
    } : {
      code: '',
      name: '',
      description: '',
      price: 0,
      stock: 0,
      lowStockAlert: 5,
    },
  });

  // Watch stock value for changes
  const currentStock = watch('stock');
  const initialStock = product?.stock || 0;

  // Show warning if stock is being changed
  if (currentStock !== initialStock && !showStockWarning) {
    setShowStockWarning(true);
  }

  const onSubmitForm = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // If user can't edit stock, revert to original stock value
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

      {showStockWarning && !canEditStock && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-md bg-yellow-900/50 p-4 text-sm text-yellow-400 ring-1 ring-yellow-500"
        >
          You don't have permission to edit stock levels. Contact an administrator for assistance.
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-200">
            Code
          </label>
          <input
            type="text"
            id="code"
            {...register('code')}
            disabled={!!product} // Disable code editing for existing products
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {errors.code && (
            <p className="mt-1 text-sm text-red-400">{errors.code.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-200">
            Name
          </label>
          <input
            type="text"
            id="name"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-200">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-200">
            Price (LKR)
          </label>
          <input
            type="number"
            id="price"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-200">
            Stock
          </label>
          <input
            type="number"
            id="stock"
            {...register('stock', { valueAsNumber: true })}
            disabled={!canEditStock && !!product}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-400">{errors.stock.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lowStockAlert" className="block text-sm font-medium text-gray-200">
            Low Stock Alert
          </label>
          <input
            type="number"
            id="lowStockAlert"
            {...register('lowStockAlert', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.lowStockAlert && (
            <p className="mt-1 text-sm text-red-400">{errors.lowStockAlert.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <motion.button
          type="button"
          onClick={onCancel}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            product ? 'Update Product' : 'Create Product'
          )}
        </motion.button>
      </div>
    </form>
  );
}
