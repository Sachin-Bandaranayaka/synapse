// src/app/(authenticated)/inventory/inventory-client.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// Define the types needed for this component
interface Product {
    id: string;
    code: string;
    name: string;
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
    adjustedBy?: {
        name: string | null;
        email: string;
    };
}

// The component receives the initial products fetched securely by the server
export function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [isLoading, setIsLoading] = useState(false); // No initial loading needed
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
    const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (selectedProduct) {
            fetchStockHistory(selectedProduct);
        }
    }, [selectedProduct]);

    const fetchStockHistory = async (productId: string) => {
        setIsLoadingHistory(true);
        try {
            // This API route is not yet secure, we will fix it next
            const response = await fetch(`/api/inventory/${productId}/history`);
            if (!response.ok) {
                throw new Error('Failed to fetch stock history');
            }
            const data = await response.json();
            setStockAdjustments(data);
        } catch (err) {
            console.error('Error fetching stock history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const getStockStatusColor = (stock: number, lowStockAlert: number) => {
        if (stock === 0) return 'bg-red-100 text-red-800 ring-red-600/20';
        if (stock <= lowStockAlert) return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
        return 'bg-green-100 text-green-800 ring-green-600/20';
    };

    const handleManualAdjustment = async (productId: string) => {
        // This route will also need to be secured
        router.push(`/products/${productId}/edit`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Track inventory levels and stock adjustment history
                    </p>
                </div>
            </div>

            {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                </div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Inventory Overview */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Stock Levels</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock Alert</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr key={product.id} className={`hover:bg-gray-50 cursor-pointer ${selectedProduct === product.id ? 'bg-gray-100' : ''}`} onClick={() => setSelectedProduct(product.id)}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                <div className="text-sm text-gray-500">{product.code}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(product.price)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStockStatusColor(product.stock, product.lowStockAlert)}`}>{product.stock}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{product.lowStockAlert}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm"><button onClick={(e) => { e.stopPropagation(); handleManualAdjustment(product.id); }} className="text-indigo-600 hover:text-indigo-900">Adjust</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Stock Adjustment History */}
                <div>
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Stock Adjustment History</h3>
                            {selectedProduct && products.find(p => p.id === selectedProduct) && (<p className="text-sm text-gray-500 mt-1">{products.find(p => p.id === selectedProduct)?.name}</p>)}
                        </div>
                        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                            {!selectedProduct ? (
                                <div className="text-center py-12 text-gray-500">Select a product to view stock history</div>
                            ) : isLoadingHistory ? (
                                <div className="text-center py-12"><div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div><p className="mt-4 text-gray-500">Loading history...</p></div>
                            ) : stockAdjustments.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">No stock adjustments found</div>
                            ) : (
                                stockAdjustments.map((adjustment, index) => (
                                    <motion.div key={adjustment.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-gray-50 rounded-lg p-4 ring-1 ring-gray-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${adjustment.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{adjustment.quantity > 0 ? '+' : ''}{adjustment.quantity}</span>
                                                    <span className="text-sm font-medium text-gray-800">{adjustment.reason}</span>
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500">Previous: {adjustment.previousStock} → New: {adjustment.newStock}</div>
                                            </div>
                                            <div className="text-xs text-gray-500">{format(new Date(adjustment.createdAt), 'MMM d, yyyy HH:mm')}</div>
                                        </div>
                                        {adjustment.adjustedBy && (<div className="mt-2 text-xs text-gray-500">Adjusted by: {adjustment.adjustedBy.name || adjustment.adjustedBy.email}</div>)}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}