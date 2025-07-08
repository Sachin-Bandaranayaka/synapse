// src/components/leads/lead-actions.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from 'next-auth';
import type { LeadWithDetails } from '@/app/(authenticated)/leads/page';
import Link from 'next/link';
import { format } from 'date-fns';

// Define the structure for a potential duplicate lead
interface PotentialDuplicate {
    productName: string;
    customerName: string;
    confirmedDate: string;
}

// --- Confirmation Modal Component ---
function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    duplicates,
    isCreating,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    duplicates: PotentialDuplicate[];
    isCreating: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-2xl rounded-lg bg-gray-800 p-6 shadow-xl ring-1 ring-white/10">
                <h2 className="text-xl font-bold text-white">Potential Duplicate Leads Found</h2>
                <p className="mt-2 text-sm text-gray-400">
                    This customer has recently purchased similar products from other companies.
                </p>

                <div className="mt-4 h-64 max-h-[50vh] overflow-y-auto rounded-md border border-gray-700">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Product Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Customer Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Confirmed Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700 bg-gray-800">
                            {duplicates.map((lead, index) => (
                                <tr key={index}>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">{lead.productName}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">{lead.customerName}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-300">{format(new Date(lead.confirmedDate), 'MMM d, yyyy')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        disabled={isCreating}
                        className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-500 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isCreating}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isCreating ? 'Creating...' : 'Proceed Anyway'}
                    </button>
                </div>
            </div>
        </div>
    );
}


// --- Main LeadActions Component ---
export function LeadActions({ 
    lead, 
    user, 
    onAction 
}: { 
    lead: LeadWithDetails, 
    user: User, 
    onAction: () => void 
}) {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [potentialDuplicates, setPotentialDuplicates] = useState<PotentialDuplicate[]>([]);

    // --- PERMISSION CHECKS ---
    const canEdit = user.role === 'ADMIN' || user.permissions?.includes('EDIT_LEADS');
    const canDelete = user.role === 'ADMIN' || user.permissions?.includes('DELETE_LEADS');
    const canCreateOrder = user.role === 'ADMIN' || user.permissions?.includes('CREATE_ORDERS');

    const handleCreateOrder = async (force: boolean = false) => {
        setIsCreating(true);
        try {
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: lead.id,
                    forceCreate: force,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to process order creation.');
            }

            // If the API requires confirmation, show the modal
            if (result.requiresConfirmation) {
                setPotentialDuplicates(result.potentialDuplicates);
                setIsModalOpen(true);
            } else {
                // Otherwise, the order was created, so navigate to it
                setIsModalOpen(false);
                router.push(`/orders/${result.id}`);
                onAction(); // Refresh the leads list
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An unknown error occurred.');
            setIsModalOpen(false);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async () => {
        // NOTE: Using a custom modal for this would be better than confirm()
        if (confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
            try {
                const response = await fetch(`/api/leads/${lead.id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to delete lead');
                }
                onAction();
            } catch (err) {
                alert(err instanceof Error ? err.message : 'An error occurred.');
            }
        }
    };

    // Only render actions for PENDING leads
    if (lead.status !== 'PENDING') {
        return null;
    }

    return (
        <>
            <div className="flex items-center space-x-3">
                {/* --- ADDED CREATE ORDER BUTTON --- */}
                {canCreateOrder && (
                    <button
                        onClick={() => handleCreateOrder(false)}
                        disabled={isCreating}
                        className="text-sm font-medium text-green-400 hover:text-green-300 disabled:opacity-50"
                    >
                        {isCreating ? 'Processing...' : 'Create Order'}
                    </button>
                )}

                {canEdit && (
                    <Link 
                        href={`/leads/${lead.id}`} 
                        className="text-sm font-medium text-indigo-400 hover:text-indigo-200"
                    >
                        Edit
                    </Link>
                )}

                {canDelete && (
                    <button
                        onClick={handleDelete}
                        className="text-sm font-medium text-red-500 hover:text-red-400"
                    >
                        Delete
                    </button>
                )}
            </div>

            {/* --- RENDER THE MODAL --- */}
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => handleCreateOrder(true)}
                duplicates={potentialDuplicates}
                isCreating={isCreating}
            />
        </>
    );
}
