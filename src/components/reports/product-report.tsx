'use client';

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { motion } from 'framer-motion';

interface ProductReportProps {
    startDate: string;
    endDate: string;
    totalProducts: number;
}

interface ProductData {
    topProducts: Array<{
        name: string;
        sales: number;
        revenue: number;
    }>;
    stockLevels: Array<{
        name: string;
        stock: number;
        lowStockAlert: number;
    }>;
    totalRevenue: number;
    averageStock: number;
}

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F59E0B'];

export function ProductReport({ startDate, endDate, totalProducts }: ProductReportProps) {
    const [data, setData] = useState<ProductData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch(
                    `/api/reports/products?startDate=${startDate}&endDate=${endDate}`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch product data');
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

    const handleExport = async (format: 'excel' | 'pdf') => {
        try {
            const response = await fetch(
                `/api/reports/products/export?startDate=${startDate}&endDate=${endDate}&format=${format}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                throw new Error('Failed to export report');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `product-report-${startDate}-to-${endDate}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export report');
        }
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
            {/* Export Buttons */}
            <div className="flex justify-end space-x-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExport('excel')}
                    className="inline-flex items-center rounded-md bg-green-900/50 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-800/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                    Export Excel
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleExport('pdf')}
                    className="inline-flex items-center rounded-md bg-red-900/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                    Export PDF
                </motion.button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                    <div className="text-sm font-medium text-gray-400">Total Products</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{totalProducts}</div>
                </div>
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                    <div className="text-sm font-medium text-gray-400">Total Revenue</div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                        LKR {(data?.totalRevenue || 0).toLocaleString()}
                    </div>
                </div>
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                    <div className="text-sm font-medium text-gray-400">Average Stock Level</div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                        {(data?.averageStock || 0).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Top Products by Revenue */}
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                    <h3 className="text-lg font-medium text-white">Top Products by Revenue</h3>
                    <div className="mt-4" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.topProducts || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9CA3AF"
                                    tick={{ fill: '#9CA3AF' }}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    tick={{ fill: '#9CA3AF' }}
                                    tickFormatter={(value) => `LKR ${value.toLocaleString()}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                    }}
                                    labelStyle={{ color: '#F3F4F6' }}
                                    itemStyle={{ color: '#F3F4F6' }}
                                    formatter={(value: number) =>
                                        `LKR ${value.toLocaleString()}`
                                    }
                                />
                                <Bar dataKey="revenue" fill="#6366F1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stock Levels */}
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                    <h3 className="text-lg font-medium text-white">Stock Levels</h3>
                    <div className="mt-4" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.stockLevels || []}
                                    dataKey="stock"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(entry) => entry.name}
                                >
                                    {(data?.stockLevels || []).map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                    }}
                                    labelStyle={{ color: '#F3F4F6' }}
                                    itemStyle={{ color: '#F3F4F6' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
} 