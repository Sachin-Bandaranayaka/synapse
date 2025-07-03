'use client';

import { useState } from 'react';
import { InvoiceTemplate } from './invoice-template';

interface InvoiceGeneratorProps {
    initialData?: {
        customerName: string;
        customerAddress: string;
        customerPhone: string;
        amount: number;
    };
    onGenerated?: () => void;
}

export function InvoiceGenerator({ initialData, onGenerated }: InvoiceGeneratorProps) {
    const [formData, setFormData] = useState({
        customerName: initialData?.customerName || '',
        customerAddress: initialData?.customerAddress || '',
        customerPhone: initialData?.customerPhone || '',
        amount: initialData?.amount || 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate invoice');
            }

            // Get the PDF blob
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a link and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'invoice.pdf';
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            onGenerated?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) : value,
        }));
    };

    return (
        <div className="space-y-8">
            {/* Preview */}
            <div className="border rounded-lg overflow-hidden">
                <InvoiceTemplate
                    customerName={formData.customerName}
                    customerAddress={formData.customerAddress}
                    customerPhone={formData.customerPhone}
                    amount={formData.amount}
                    referenceNumber="PREVIEW"
                />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="customerName" className="block text-sm font-medium text-gray-400">
                            Customer Name
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="customerName"
                                id="customerName"
                                required
                                value={formData.customerName}
                                onChange={handleChange}
                                className="ring-1 ring-white/10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-600 rounded-md"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-400">
                            Phone Number
                        </label>
                        <div className="mt-1">
                            <input
                                type="tel"
                                name="customerPhone"
                                id="customerPhone"
                                required
                                value={formData.customerPhone}
                                onChange={handleChange}
                                className="ring-1 ring-white/10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-600 rounded-md"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-400">
                            Address
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="customerAddress"
                                id="customerAddress"
                                required
                                value={formData.customerAddress}
                                onChange={handleChange}
                                className="ring-1 ring-white/10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-600 rounded-md"
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-400">
                            Amount (Rs.)
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="amount"
                                id="amount"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                                className="ring-1 ring-white/10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-600 rounded-md"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent ring-1 ring-white/10 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isLoading ? 'Generating...' : 'Generate Invoice'}
                    </button>
                </div>
            </form>
        </div>
    );
} 