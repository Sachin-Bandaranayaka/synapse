// src/components/orders/cancel-order-button.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface CancelOrderButtonProps {
    orderId: string;
    orderStatus: string;
    isShipped?: boolean;
}

export function CancelOrderButton({ orderId, orderStatus, isShipped = false }: CancelOrderButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    // Check if cancellation is allowed
    const canCancel = ['PENDING', 'CONFIRMED'].includes(orderStatus);
    const isAlreadyCancelled = orderStatus === 'CANCELLED';
    
    if (isAlreadyCancelled || !canCancel) {
        return null; // Don't show cancel button for shipped/delivered/returned orders
    }

    const handleCancel = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'CANCELLED',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to cancel order');
            }

            // Refresh the page to show the updated status
            router.refresh();
        } catch (error) {
            console.error('Error canceling order:', error);
            alert('Failed to cancel order. Please try again.');
        } finally {
            setIsLoading(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            {!showConfirm ? (
                <motion.button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center rounded-md border border-red-700 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    disabled={isLoading}
                >
                    Cancel Order
                </motion.button>
            ) : (
                <div className="flex space-x-2">
                    <motion.button
                        type="button"
                        onClick={() => setShowConfirm(false)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center rounded-md border border-gray-700 px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        disabled={isLoading}
                    >
                        No, Keep Order
                    </motion.button>
                    <motion.button
                        type="button"
                        onClick={handleCancel}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center rounded-md border border-red-700 bg-red-900/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            'Yes, Cancel Order'
                        )}
                    </motion.button>
                </div>
            )}
        </>
    );
}