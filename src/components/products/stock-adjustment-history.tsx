'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';

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

interface StockAdjustmentHistoryProps {
    adjustments: StockAdjustment[];
}

export function StockAdjustmentHistory({ adjustments }: StockAdjustmentHistoryProps) {
    if (adjustments.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                No stock adjustments found
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {adjustments.map((adjustment, index) => (
                <motion.div
                    key={adjustment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-700/50 rounded-lg p-4 ring-1 ring-gray-600"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                                    adjustment.quantity > 0
                                        ? 'bg-green-900/50 text-green-300 ring-1 ring-green-500/50'
                                        : 'bg-red-900/50 text-red-300 ring-1 ring-red-500/50'
                                }`}>
                                    {adjustment.quantity > 0 ? '+' : ''}{adjustment.quantity}
                                </span>
                                <span className="text-sm font-medium text-gray-200">
                                    {adjustment.reason}
                                </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-400">
                                Previous: {adjustment.previousStock} → New: {adjustment.newStock}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">
                                {format(new Date(adjustment.createdAt), 'PPp')}
                            </div>
                            <div className="mt-1 text-sm text-gray-400">
                                by {adjustment.adjustedBy.name || adjustment.adjustedBy.email}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
} 