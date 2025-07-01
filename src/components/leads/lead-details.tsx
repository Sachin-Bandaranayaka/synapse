'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { LeadEditModal } from './lead-edit-modal';
import { PencilIcon } from '@heroicons/react/24/solid';

interface Product {
    id: string;
    name: string;
    code: string;
    price: number;
}

interface User {
    id: string;
    name: string | null;
    email: string;
}

interface Order {
    id: string;
    status: string;
    product: Product;
    quantity: number;
    createdAt: Date;
}

interface Lead {
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
    status: string;
    product: Product;
    assignedTo: User;
    createdAt: Date;
    order?: Order | null;
}

interface LeadDetailsProps {
    lead: Lead;
}

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'NO_ANSWER', label: 'No Answer' },
    { value: 'REJECTED', label: 'Rejected' },
];

export function LeadDetails({ lead }: LeadDetailsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([lead.product]);

    // Fetch all products when opening the edit modal
    const openEditModal = async () => {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
            setIsEditModalOpen(true);
        } catch (err) {
            console.error('Failed to fetch products:', err);
            // Still open the modal with at least the current product
            setIsEditModalOpen(true);
        }
    };

    const handleCreateOrder = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    leadId: lead.id,
                    quantity: lead.csvData.quantity || 1,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create order');
            }

            const order = await response.json();
            router.push(`/orders/${order.id}`);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/leads/${lead.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update status');
            }

            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Status Update */}
            {lead.status !== 'CONFIRMED' && (
                <div>
                    <h3 className="text-lg font-medium text-gray-100 mb-4">Lead Status</h3>
                    <div className="flex items-center space-x-4">
                        <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            disabled={isLoading}
                            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                            {STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {isLoading && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                        )}
                    </div>
                </div>
            )}

            {/* Customer Information */}
            <div>
                <h3 className="text-lg font-medium text-gray-100 mb-4">Customer Information</h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Name</dt>
                        <dd className="mt-1 text-sm text-gray-200">
                            {(lead.csvData as any).name || (lead.csvData as any).customer_name || 'Unnamed Lead'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Phone</dt>
                        <dd className="mt-1 text-sm text-gray-200">{lead.csvData.phone}</dd>
                    </div>
                    {lead.csvData.secondPhone && (
                        <div>
                            <dt className="text-sm font-medium text-gray-400">Second Phone</dt>
                            <dd className="mt-1 text-sm text-gray-200">{lead.csvData.secondPhone}</dd>
                        </div>
                    )}
                    {((lead.csvData as any).email) && (
                        <div>
                            <dt className="text-sm font-medium text-gray-400">Email</dt>
                            <dd className="mt-1 text-sm text-gray-200">{(lead.csvData as any).email}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-sm font-medium text-gray-400">City</dt>
                        <dd className="mt-1 text-sm text-gray-200">
                            {(lead.csvData as any).city || (lead.csvData as any).customer_city || ''}
                        </dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-400">Address</dt>
                        <dd className="mt-1 text-sm text-gray-200">{lead.csvData.address}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Source</dt>
                        <dd className="mt-1 text-sm text-gray-200">
                            {(lead.csvData as any).source || (lead.csvData as any).customer_source || ''}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Created</dt>
                        <dd className="mt-1 text-sm text-gray-200">
                            {format(new Date(lead.createdAt), 'PPp')}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Quantity</dt>
                        <dd className="mt-1 text-sm text-gray-200">
                            {(lead.csvData as any).quantity || 1}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Discount</dt>
                        <dd className="mt-1 text-sm text-gray-200">
                            {(lead.csvData as any).discount ? `LKR ${(lead.csvData as any).discount.toLocaleString()}` : 'LKR 0'}
                        </dd>
                    </div>
                    {((lead.csvData as any).notes || (lead.csvData as any).customer_notes) && (
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-400">Notes</dt>
                            <dd className="mt-1 text-sm text-gray-200">
                                {(lead.csvData as any).notes || (lead.csvData as any).customer_notes}
                            </dd>
                        </div>
                    )}
                </dl>
            </div>

            {/* Product Information */}
            <div>
                <h3 className="text-lg font-medium text-gray-100 mb-4">Product Information</h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Product</dt>
                        <dd className="mt-1 text-sm text-gray-200">{lead.product.name}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Code</dt>
                        <dd className="mt-1 text-sm text-gray-200">{lead.product.code}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-400">Price</dt>
                        <dd className="mt-1 text-sm text-gray-200">
                            LKR {lead.product.price.toLocaleString()}
                        </dd>
                    </div>
                </dl>
            </div>

            {/* Order Information */}
            {lead.order && (
                <div>
                    <h3 className="text-lg font-medium text-gray-100 mb-4">Order Information</h3>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-medium text-gray-400">Order ID</dt>
                            <dd className="mt-1 text-sm text-gray-200">{lead.order.id}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-400">Status</dt>
                            <dd className="mt-1 text-sm text-gray-200">{lead.order.status.toLowerCase()}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-400">Quantity</dt>
                            <dd className="mt-1 text-sm text-gray-200">{lead.order.quantity}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-400">Created</dt>
                            <dd className="mt-1 text-sm text-gray-200">
                                {format(new Date(lead.order.createdAt), 'PPp')}
                            </dd>
                        </div>
                    </dl>
                </div>
            )}

            {error && (
                <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500">
                    {error}
                </div>
            )}

            {/* Actions */}
            {lead.status === 'PENDING' && (
                <div className="flex justify-end space-x-4">
                    <motion.button
                        type="button"
                        onClick={openEditModal}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center rounded-md border border-indigo-700 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Edit Lead
                    </motion.button>
                    <motion.button
                        type="button"
                        onClick={() => handleStatusChange('NO_ANSWER')}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center rounded-md border border-orange-700 px-4 py-2 text-sm font-medium text-orange-300 hover:bg-orange-900/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                        Mark as No Answer
                    </motion.button>
                    <motion.button
                        type="button"
                        onClick={() => handleStatusChange('REJECTED')}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center rounded-md border border-red-700 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Reject Lead
                    </motion.button>
                    <motion.button
                        type="button"
                        onClick={handleCreateOrder}
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        {isLoading ? 'Processing...' : 'Create Order'}
                    </motion.button>
                </div>
            )}

            {/* Edit Modal */}
            <LeadEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                lead={lead}
                products={products}
            />
        </div>
    );
} 