// 

'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { ShippingProvider } from '@prisma/client';

// FIX: Add canExport to the props interface
interface ShippingReportProps {
    startDate: string;
    endDate: string;
    totalShipments: number;
    shippingStats: Record<string, number>;
    canExport?: boolean;
}

interface ShippingData {
    dailyShipments: Array<{ date: string; count: number; }>;
    providerPerformance: Array<{ provider: string; shipments: number; }>;
    onTimeDeliveryRate: number;
    averageDeliveryTime: number;
}

export function ShippingReport({ startDate, endDate, canExport, shippingStats, totalShipments }: ShippingReportProps) {
    const [data, setData] = useState<ShippingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<ShippingProvider | 'ALL'>('ALL');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                let url = `/api/reports/shipping?startDate=${startDate}&endDate=${endDate}`;
                if (provider !== 'ALL') {
                    url += `&provider=${provider}`;
                }
                const response = await fetch(url);
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.details || 'Failed to fetch shipping data');
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
    }, [startDate, endDate, provider]);

    // FIX: Simplified export handler
    const handleExport = (format: 'excel' | 'pdf') => {
        let url = `/api/reports/shipping/export?startDate=${startDate}&endDate=${endDate}&format=${format}`;
        if (provider !== 'ALL') {
            url += `&provider=${provider}`;
        }
        window.open(url, '_blank');
    };

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div></div>;
    }

    if (error) {
        return <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500">{error}</div>;
    }

    // This guard clause is still useful in case the API returns an empty response
    if (!data) {
        return <div className="text-center py-12 text-gray-500">No shipping data available for this period.</div>;
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <label htmlFor="provider-select" className="block text-sm font-medium text-gray-400">Filter by Provider</label>
                    <select
                        id="provider-select"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value as ShippingProvider | 'ALL')}
                        className="mt-1 block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="ALL">All Providers</option>
                        {Object.keys(shippingStats).map(p => (
                            <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>

                {/* FIX: Conditionally render export buttons */}
                {canExport && (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-400">Export as:</span>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleExport('excel')} className="inline-flex items-center rounded-md bg-green-900/50 px-3 py-2 text-sm font-semibold text-green-300 hover:bg-green-800/50">Excel</motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleExport('pdf')} className="inline-flex items-center rounded-md bg-red-900/50 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-800/50">PDF</motion.button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"><div className="text-sm font-medium text-gray-400">Total Shipments</div><div className="mt-2 text-3xl font-semibold text-white">{totalShipments}</div></div>
                {/* FIX: Added safety checks to prevent crashes */}
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"><div className="text-sm font-medium text-gray-400">On-Time Delivery Rate</div><div className="mt-2 text-3xl font-semibold text-white">{(data?.onTimeDeliveryRate ?? 0 * 100).toFixed(1)}%</div></div>
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"><div className="text-sm font-medium text-gray-400">Avg. Delivery Time</div><div className="mt-2 text-3xl font-semibold text-white">{(data?.averageDeliveryTime ?? 0).toFixed(1)} days</div></div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"><h3 className="text-lg font-medium text-white">Daily Shipments</h3><div className="mt-4" style={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={data.dailyShipments}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} /><YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} allowDecimals={false} /><Tooltip contentStyle={{ backgroundColor: '#1F2937' }} /><Legend /><Line type="monotone" dataKey="count" name="Shipments" stroke="#4f46e5" strokeWidth={2} /></LineChart></ResponsiveContainer></div></div>
                <div className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10"><h3 className="text-lg font-medium text-white">Provider Performance</h3><div className="mt-4" style={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={data.providerPerformance} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} /><YAxis type="category" dataKey="provider" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} width={100} /><Tooltip contentStyle={{ backgroundColor: '#1F2937' }} /><Legend /><Bar dataKey="shipments" name="Total Shipments" fill="#4f46e5" /></BarChart></ResponsiveContainer></div></div>
            </div>
        </div>
    );
}