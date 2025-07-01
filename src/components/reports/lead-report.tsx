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
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { motion } from 'framer-motion';

interface LeadReportProps {
    startDate: string;
    endDate: string;
    totalLeads: number;
}

interface LeadData {
    dailyLeads: Array<{
        date: string;
        count: number;
        converted: number;
    }>;
    leadsByStatus: Array<{
        status: string;
        count: number;
    }>;
    conversionRate: number;
    averageResponseTime: number;
}

const STATUS_COLORS = {
    NEW: '#6366F1',
    CONTACTED: '#8B5CF6',
    QUALIFIED: '#EC4899',
    PROPOSAL: '#F43F5E',
    CONVERTED: '#10B981',
    LOST: '#6B7280',
};

export function LeadReport({ startDate, endDate, totalLeads }: LeadReportProps) {
    const [data, setData] = useState<LeadData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch(
                    `/api/reports/leads?startDate=${startDate}&endDate=${endDate}`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch lead data');
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
                `/api/reports/leads/export?startDate=${startDate}&endDate=${endDate}&format=${format}`,
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
            a.download = `lead-report-${startDate}-to-${endDate}.${format}`;
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
                <div className="rounded-lg bg-gray-700/50 p-6 ring-1 ring-gray-600">
                    <div className="text-sm font-medium text-gray-400">Total Leads</div>
                    <div className="mt-2 text-3xl font-semibold text-gray-100">
                        {totalLeads}
                    </div>
                </div>
                <div className="rounded-lg bg-gray-700/50 p-6 ring-1 ring-gray-600">
                    <div className="text-sm font-medium text-gray-400">Conversion Rate</div>
                    <div className="mt-2 text-3xl font-semibold text-gray-100">
                        {((data?.conversionRate || 0) * 100).toFixed(1)}%
                    </div>
                </div>
                <div className="rounded-lg bg-gray-700/50 p-6 ring-1 ring-gray-600">
                    <div className="text-sm font-medium text-gray-400">Avg. Response Time</div>
                    <div className="mt-2 text-3xl font-semibold text-gray-100">
                        {(data?.averageResponseTime || 0).toFixed(1)} hours
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Daily Leads */}
                <div className="rounded-lg bg-gray-700/50 p-6 ring-1 ring-gray-600">
                    <h3 className="text-lg font-medium text-gray-100">Daily Leads</h3>
                    <div className="mt-4" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data?.dailyLeads || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    tick={{ fill: '#9CA3AF' }}
                                />
                                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                    }}
                                    labelStyle={{ color: '#F3F4F6' }}
                                    itemStyle={{ color: '#F3F4F6' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="Total Leads"
                                    stroke="#6366F1"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="converted"
                                    name="Converted"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Leads by Status */}
                <div className="rounded-lg bg-gray-700/50 p-6 ring-1 ring-gray-600">
                    <h3 className="text-lg font-medium text-gray-100">Leads by Status</h3>
                    <div className="mt-4" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.leadsByStatus || []}
                                    dataKey="count"
                                    nameKey="status"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(entry) => entry.status}
                                >
                                    {(data?.leadsByStatus || []).map((entry) => (
                                        <Cell
                                            key={entry.status}
                                            fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]}
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