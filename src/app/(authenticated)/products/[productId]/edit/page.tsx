'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ProductForm } from '@/components/products/product-form';
import { StockAdjustmentHistory } from '@/components/products/stock-adjustment-history';
import { motion } from 'framer-motion';

interface Product {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    price: number;
    stock: number;
    lowStockAlert: number;
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

export default function EditProductPage({ params }: { params: { productId: string } }) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [product, setProduct] = useState<Product | null>(null);
    const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch product details
                const productResponse = await fetch(`/api/products/${params.productId}`);
                if (!productResponse.ok) {
                    throw new Error('Failed to fetch product');
                }
                const productData = await productResponse.json();
                setProduct(productData);

                // Fetch stock adjustment history
                const historyResponse = await fetch(`/api/products/${params.productId}/stock-history`);
                if (!historyResponse.ok) {
                    throw new Error('Failed to fetch stock history');
                }
                const historyData = await historyResponse.json();
                setStockAdjustments(historyData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user) {
            fetchProduct();
        }
    }, [params.productId, session]);

    const handleSubmit = async (data: any) => {
        try {
            const response = await fetch(`/api/products/${params.productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update product');
            }

            router.push('/products');
            router.refresh();
        } catch (err) {
            throw err;
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500">
                {error}
            </div>
        );
    }

    if (!product) {
        return (
            <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500">
                Product not found
            </div>
        );
    }

    // Check if user has permission to edit stock
    const canEditStock = session?.user?.role === 'ADMIN' || session?.user?.role === 'TEAM_MEMBER';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-100">Edit Product</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Update product details and manage stock
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.back()}
                    className="inline-flex items-center px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Back to Products
                </motion.button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Product Form */}
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden ring-1 ring-gray-700">
                    <div className="p-6">
                        <ProductForm
                            product={product}
                            onSubmit={handleSubmit}
                            onCancel={() => router.back()}
                            canEditStock={canEditStock}
                        />
                    </div>
                </div>

                {/* Stock Adjustment History */}
                <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden ring-1 ring-gray-700">
                    <div className="p-6">
                        <h2 className="text-lg font-medium text-gray-100 mb-4">Stock Adjustment History</h2>
                        <StockAdjustmentHistory adjustments={stockAdjustments} />
                    </div>
                </div>
            </div>
        </div>
    );
} 