// src/app/(authenticated)/dashboard/dashboard-client.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LeadsChart } from '@/components/dashboard/leads-chart';

// Define the types for the data we receive from the server component
interface DashboardData {
    dailyOrders: number;
    dailyRevenue: number;
    dailyLeads: number;
    dailyConversionRate: number;
    weeklyOrders: number;
    weeklyRevenue: number;
    weeklyLeads: number;
    weeklyConversionRate: number;
    monthlyOrders: number;
    monthlyRevenue: number;
    monthlyLeads: number;
    monthlyConversionRate: number;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    leadsByStatus: Array<{ status: string; count: number; }>;
}

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const handleRefresh = () => {
        setIsLoading(true);
        router.refresh(); // This tells Next.js to re-run the Server Component
        setLastRefresh(new Date());
        // A small delay to show the loading state
        setTimeout(() => setIsLoading(false), 500);
    };

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <div className="flex items-center space-x-4">
                    <div className="text-xs text-gray-500">
                        <div>Last refreshed: {lastRefresh.toLocaleTimeString()}</div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        ) : (
                            'Refresh'
                        )}
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-6">
                {/* Daily Metrics */}
                <div>
                    <h2 className="text-xl font-medium text-gray-800 mb-4">Daily Overview</h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-lg bg-white p-6 shadow">
                            <div className="text-sm font-medium text-gray-500">Orders</div>
                            <div className="mt-2 text-3xl font-semibold text-gray-900">{initialData.dailyOrders}</div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg bg-white p-6 shadow">
                            <div className="text-sm font-medium text-gray-500">Revenue</div>
                            <div className="mt-2 text-3xl font-semibold text-gray-900">LKR {initialData.dailyRevenue.toFixed(2)}</div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-lg bg-white p-6 shadow">
                            <div className="text-sm font-medium text-gray-500">Leads</div>
                            <div className="mt-2 text-3xl font-semibold text-gray-900">{initialData.dailyLeads}</div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-lg bg-white p-6 shadow">
                            <div className="text-sm font-medium text-gray-500">Conversion Rate</div>
                            <div className="mt-2 text-3xl font-semibold text-gray-900">{initialData.dailyConversionRate.toFixed(1)}%</div>
                        </motion.div>
                    </div>
                </div>

                {/* Weekly and Monthly Metrics can be added here following the same pattern */}
                
            </div>

            {/* Lead Conversion */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-lg font-medium text-gray-900">Lead Conversion (All Time)</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200"><div className="text-sm text-gray-600">Total Leads</div><div className="mt-2 text-2xl font-semibold text-gray-900">{initialData.totalLeads}</div></div>
                    <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200"><div className="text-sm text-gray-600">Converted Leads</div><div className="mt-2 text-2xl font-semibold text-gray-900">{initialData.convertedLeads}</div></div>
                    <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200"><div className="text-sm text-gray-600">Conversion Rate</div><div className="mt-2 text-2xl font-semibold text-gray-900">{(initialData.conversionRate).toFixed(1)}%</div></div>
                </div>
                <div className="mt-6">
                    <LeadsChart data={initialData.leadsByStatus} />
                </div>
            </motion.div>
        </div>
    );
}