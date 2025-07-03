'use client';

import { motion } from 'framer-motion';

interface PrintButtonProps {
    orderId?: string;
}

export function PrintButton({ orderId }: PrintButtonProps = {}) {
    return (
        <motion.button
            onClick={() => window.print()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md ring-1 ring-white/10 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 print:hidden"
        >
            Print Invoice
        </motion.button>
    );
} 