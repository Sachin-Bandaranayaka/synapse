// src/components/leads/lead-edit-form.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { z } from 'zod';

interface Product {
    id: string;
    name: string;
    code: string;
    price?: number;
}

export interface Lead {
    id: string;
    csvData: {
        name: string;
        phone: string;
        secondPhone?: string;
        email?: string | null;
        address: string;
        city: string;
        source: string;
        notes?: string;
        quantity?: number;
        discount?: number;
    };
    productCode: string;
    product: Product;
}

interface LeadEditFormProps {
    lead: Lead;
    products: Product[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

const leadSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    secondPhone: z.string().optional(),
    email: z.string().email('Invalid email').optional().nullable(),
    address: z.string().min(1, 'Address is required'),
    city: z.string().optional().default(""),
    source: z.string().optional().default(""),
    notes: z.string().optional(),
    productCode: z.string().min(1, 'Product is required'),
    quantity: z.number().int().positive().default(1),
    discount: z.number().min(0).default(0),
});

type LeadFormData = z.infer<typeof leadSchema>;

export function LeadEditForm({ lead, products, onSuccess, onCancel }: LeadEditFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<LeadFormData>({
        name: lead.csvData.name || '',
        phone: lead.csvData.phone || '',
        secondPhone: lead.csvData.secondPhone || '',
        email: lead.csvData.email || null,
        address: lead.csvData.address || '',
        city: lead.csvData.city || '',
        source: lead.csvData.source || '',
        notes: lead.csvData.notes || '',
        productCode: lead.productCode || '',
        quantity: lead.csvData.quantity || 1,
        discount: lead.csvData.discount || 0,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Validate form data
            const validatedData = leadSchema.parse(formData);

            // Send request to update lead
            const response = await fetch(`/api/leads/${lead.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    csvData: {
                        name: validatedData.name,
                        phone: validatedData.phone,
                        secondPhone: validatedData.secondPhone,
                        email: validatedData.email,
                        address: validatedData.address,
                        city: validatedData.city,
                        source: validatedData.source,
                        notes: validatedData.notes,
                        quantity: validatedData.quantity,
                        discount: validatedData.discount,
                    },
                    productCode: validatedData.productCode,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update lead');
            }

            // Call onSuccess callback if provided
            onSuccess?.();

            // Refresh the page to show the updated data
            router.refresh();
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.errors[0].message);
            } else {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-400">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-400">
                        Phone
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="secondPhone" className="block text-sm font-medium text-gray-400">
                        Second Phone (Optional)
                    </label>
                    <input
                        type="tel"
                        id="secondPhone"
                        value={formData.secondPhone || ''}
                        onChange={(e) => setFormData({ ...formData, secondPhone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                        Email (Optional)
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value || null })}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-400">
                        City
                    </label>
                    <input
                        type="text"
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-400">
                        Address
                    </label>
                    <input
                        type="text"
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="source" className="block text-sm font-medium text-gray-400">
                        Source
                    </label>
                    <input
                        type="text"
                        id="source"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="product" className="block text-sm font-medium text-gray-400">
                        Product
                    </label>
                    <select
                        id="product"
                        value={formData.productCode}
                        onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                            <option key={product.code} value={product.code}>
                                {product.name} - {product.code}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-400">
                        Quantity
                    </label>
                    <input
                        type="number"
                        id="quantity"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-gray-400">
                        Discount
                    </label>
                    <input
                        type="number"
                        id="discount"
                        min="0"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-400">
                        Notes (Optional)
                    </label>
                    <textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-gray-100 ring-1 ring-white/10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500">
                    {error}
                </div>
            )}

            <div className="flex justify-end space-x-4">
                <motion.button
                    type="button"
                    onClick={onCancel}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Cancel
                </motion.button>
                <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/10 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </motion.button>
            </div>
        </form>
    );
}