'use client';

import { useState, useEffect } from 'react';
import { LeadForm } from './lead-form';
import { BulkLeadImport } from './bulk-lead-import';

interface Product {
    id: string;
    name: string;
    code: string;
    price: number;
}

export function LeadActions() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProducts() {
            try {
                const response = await fetch('/api/products');
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                const data = await response.json();
                setProducts(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load products');
            } finally {
                setIsLoading(false);
            }
        }

        if (showCreateForm) {
            fetchProducts();
        }
    }, [showCreateForm]);

    return (
        <>
            {showCreateForm && (
                <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full ring-1 ring-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">Add New Lead</h2>
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="text-gray-400 hover:text-gray-100"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                            </div>
                        ) : error ? (
                            <div className="text-red-400 text-center py-8">
                                {error}
                            </div>
                        ) : (
                            <LeadForm
                                products={products}
                                onSubmit={async () => {
                                    setShowCreateForm(false);
                                    // You might want to add a refresh mechanism here
                                }}
                                onCancel={() => setShowCreateForm(false)}
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
} 