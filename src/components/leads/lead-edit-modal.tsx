'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LeadEditForm } from './lead-edit-form';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Product {
    id: string;
    name: string;
    code: string;
    price?: number;
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
    };
    productCode: string;
    product: Product;
}

interface LeadEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
    products: Product[];
}

export function LeadEditModal({ isOpen, onClose, lead, products }: LeadEditModalProps) {
    // Close modal when Escape key is pressed
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-gray-900/80 z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                    >
                        <div className="relative w-full max-w-3xl rounded-lg bg-gray-800 p-6 ring-1 ring-white/10 overflow-y-auto max-h-[90vh]">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">Edit Lead</h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-100"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <LeadEditForm
                                lead={lead}
                                products={products}
                                onSuccess={onClose}
                                onCancel={onClose}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
} 