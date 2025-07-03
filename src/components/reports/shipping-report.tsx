// src/components/reports/shipping-report.tsx

'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { motion } from 'framer-motion';
import { ShippingProvider } from '@prisma/client';

interface ShippingReportProps {
    startDate: string;
    endDate: string;
    totalShipments: number;
    shippingStats: Record<string, number>;
}

interface ShippingData {
    dailyShipments: Array<{
        date: string;
        count: number;
        onTime: number;
        delayed: number;
    }>;
    providerPerformance: Array<{
        provider: string;
        shipments: number;
        onTimeDelivery: number;
        averageDeliveryTime: number;
    }>;
    onTimeDeliveryRate: number;
    averageDeliveryTime: number;
}

export function ShippingReport({ startDate, endDate, totalShipments, shippingStats }: ShippingReportProps) {
    const [data, setData] = useState<ShippingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Add state for the selected provider
    const [provider, setProvider] = useState<ShippingProvider | 'ALL'>('ALL');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Construct URL with the provider parameter for fetching JSON data
                let url = `/api/reports/shipping?startDate=${startDate}&endDate=${endDate}&format=json`;
                if (provider !== 'ALL') {
                    url += `&provider=${provider}`;
                }

                const response = await fetch(url);

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to fetch shipping data');
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
    }, [startDate, endDate, provider]); // Re-fetch when the provider changes

    const handleExport = async (format: 'excel' | 'pdf') => {
        try {
            // Construct URL with provider and format for file export
            let url = `/api/reports/shipping?startDate=${startDate}&endDate=${endDate}&format=${format}`;
            if (provider !== 'ALL') {
                url += `&provider=${provider}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to export report');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `shipping-report-${startDate}-to-${endDate}.${format === 'excel' ? 'xlsx' : format}`;
            document.body.appendChild(a);
a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export report');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                {error}
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Provider Filter Dropdown */}
                <div>
                    <label htmlFor="provider-select" className="block text-sm font-medium text-gray-400">Filter by Provider</label>
                    <select
                        id="provider-select"
                        name="provider"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as ShippingProvider | 'ALL')}
                        className="mt-1 block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="ALL">All Providers</option>
                        {/* Dynamically create options from initial stats */}
                        {Object.keys(shippingStats).map(p => (
                            <option key={p} value={p}>{p.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-400">Export as:</span>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleExport('excel')} className="inline-flex items-center rounded-md bg-green-900/50 px-3 py-2 text-sm font-semibold text-green-300 hover:bg-green-800/50">Excel</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleExport('pdf')} className="inline-flex items-center rounded-md bg-red-900/50 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-800/50">PDF</motion.button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"><div className="text-sm font-medium text-gray-400">Total Shipments</div><div className="mt-2 text-3xl font-semibold text-white">{totalShipments}</div></div>
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"><div className="text-sm font-medium text-gray-400">On-Time Delivery Rate</div><div className="mt-2 text-3xl font-semibold text-white">{(data.onTimeDeliveryRate * 100).toFixed(1)}%</div></div>
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"><div className="text-sm font-medium text-gray-400">Avg. Delivery Time</div><div className="mt-2 text-3xl font-semibold text-white">{data.averageDeliveryTime.toFixed(1)} days</div></div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"><h3 className="text-lg font-medium text-white">Daily Shipments</h3><div className="mt-4" style={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={data.dailyShipments}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} /><YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} /><Line type="monotone" dataKey="count" name="Total" stroke="#4f46e5" strokeWidth={2} /><Line type="monotone" dataKey="onTime" name="On Time" stroke="#10b981" strokeWidth={2} /><Line type="monotone" dataKey="delayed" name="Delayed" stroke="#f43f5e" strokeWidth={2} /></LineChart></ResponsiveContainer></div></div>
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"><h3 className="text-lg font-medium text-white">Provider Performance</h3><div className="mt-4" style={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.providerPerformance}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="provider" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} /><YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} /><Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} formatter={(value: number) => `${(value * 100).toFixed(1)}%`} /><Bar dataKey="onTimeDelivery" name="On-Time Delivery Rate" fill="#4f46e5" /></BarChart></ResponsiveContainer></div></div>
            </div>
        </div>
    );
}