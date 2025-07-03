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
    BarChart,
    Bar,
} from 'recharts';
import { motion } from 'framer-motion';

interface SalesReportProps {
    startDate: string;
    endDate: string;
    totalOrders: number;
}

interface SalesData {
    dailyRevenue: Array<{
        date: string;
        revenue: number;
    }>;
    totalRevenue: number;
    averageOrderValue: number;
}

export function SalesReport({ startDate, endDate, totalOrders }: SalesReportProps) {
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

    const handleExport = async (format: 'excel' | 'pdf') => {
        try {
            const response = await fetch(
                `/api/reports/sales/export?startDate=${startDate}&endDate=${endDate}&format=${format}`,
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
            a.download = `sales-report-${startDate}-to-${endDate}.${format}`;
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
                        LKR {data.averageOrderValue.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                <h3 className="text-lg font-medium text-white">Daily Revenue</h3>
                <div className="mt-4" style={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data.dailyRevenue}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="date"
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
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#6366F1"
                                strokeWidth={2}
                                dot={{ fill: '#6366F1', strokeWidth: 2 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
} 