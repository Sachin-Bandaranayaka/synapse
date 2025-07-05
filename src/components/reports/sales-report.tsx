// src/components/reports/sales-report.tsx

'use client';

import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';

// --- FIX: Update props to accept the permission flag ---
interface SalesReportProps {
    startDate: string;
    endDate: string;
    totalOrders: number;
    canExport?: boolean; // This prop is passed from report-tabs.tsx
}

interface SalesData {
    dailyRevenue: Array<{
        date: string;
        revenue: number;
    }>;
    totalRevenue: number;
    averageOrderValue: number;
}

export function SalesReport({ startDate, endDate, totalOrders, canExport }: SalesReportProps) {
    const [data, setData] = useState<SalesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch(
                    `/api/reports/sales?startDate=${startDate}&endDate=${endDate}`
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch sales data');
                }
                const jsonData = await response.json();
                setData(jsonData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate]);

    // --- FIX: Simplified and corrected export handler ---
    const handleExport = (format: 'excel' | 'csv' | 'pdf') => { // Add 'pdf' back to the type
        const url = `/api/reports/sales/export?startDate=${startDate}&endDate=${endDate}&format=${format}`;
        window.open(url, '_blank');
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500">
                {error}
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* --- FIX: Conditionally render the export buttons based on permission --- */}
            {canExport && (
                <div className="flex justify-end space-x-4">
                    <motion.button
                        onClick={() => handleExport('excel')}
                        className="inline-flex items-center rounded-md bg-green-900/50 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-800/50"
                    >
                        Export Excel
                    </motion.button>
                    {/* --- FIX: ADDED PDF BUTTON BACK --- */}
                    <motion.button
                        onClick={() => handleExport('pdf')}
                        className="inline-flex items-center rounded-md bg-red-900/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-800/50"
                    >
                        Export PDF
                    </motion.button>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                    <div className="text-sm font-medium text-gray-400">Total Orders</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{totalOrders}</div>
                </div>
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                    <div className="text-sm font-medium text-gray-400">Total Revenue</div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                        LKR {data.totalRevenue.toLocaleString()}
                    </div>
                </div>
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                    <div className="text-sm font-medium text-gray-400">Average Order Value</div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                        LKR {data.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                <h3 className="text-lg font-medium text-white">Daily Revenue</h3>
                <div className="mt-4" style={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.dailyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                            <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickFormatter={(value) => `LKR ${value.toLocaleString()}`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '0.5rem',
                                }}
                                labelStyle={{ color: '#F3F4F6' }}
                                itemStyle={{ color: '#6366F1' }}
                                formatter={(value: number) => `LKR ${value.toLocaleString()}`}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}