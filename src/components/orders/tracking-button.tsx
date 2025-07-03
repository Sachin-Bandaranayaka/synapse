'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface TrackingButtonProps {
    orderId: string;
    hasTracking: boolean;
}

export function TrackingButton({ orderId, hasTracking }: TrackingButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkTracking = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/orders/${orderId}/tracking`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to fetch tracking information');
            }
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasTracking) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-gray-800 p-4 text-center text-sm text-gray-400 ring-1 ring-white/10"
            >
                No tracking information available
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={checkTracking}
                disabled={isLoading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white ring-1 ring-white/10 transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="flex items-center justify-center">
                    {isLoading ? (
                        <>
                            <svg
                                className="mr-3 h-5 w-5 animate-spin text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                            Checking tracking status...
                        </>
                    ) : (
                        <>
                            <svg
                                className="mr-2 h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                />
                            </svg>
                            Check Tracking Status
                        </>
                    )}
                </span>
            </motion.button>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-md bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500"
                >
                    {error}
                </motion.div>
            )}
        </div>
    );
} 