'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LeadsChart } from '@/components/dashboard/leads-chart';
import { ProfitSummary } from '@/components/dashboard/profit-summary';
import Link from 'next/link';

interface PeriodStats {
    orders: number;
    revenue: number;
    leads: number;
    conversionRate: number;
    orderSuccessRate: number;
    orderReturnRate: number;
}

interface DashboardData {
    daily: PeriodStats;
    weekly: PeriodStats;
    monthly: PeriodStats;
    allTime: {
        totalLeads: number;
        convertedLeads: number;
        conversionRate: number;
        orderSuccessRate: number;
        orderReturnRate: number;
    };
    leadsByStatus: Array<{ status: string; count: number; }>;
    noStockCount: number;
    lowStockCount: number;
}

type TimeFilter = 'daily' | 'weekly' | 'monthly';

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [activeFilter, setActiveFilter] = useState<TimeFilter>('daily');

    const handleRefresh = () => {
        setIsLoading(true);
        router.refresh();
        setLastRefresh(new Date());
        setTimeout(() => setIsLoading(false), 500);
    };

    const currentData = initialData[activeFilter];

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            </div>

            <div>
                <div className="flex flex-col space-y-4 mb-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    <h2 className="text-xl font-medium text-gray-200">Overview</h2>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        {/* --- FIX: Conditionally render the Low Stock button --- */}
                        {initialData.lowStockCount > 0 && (
                            <Link href="/products" className="flex items-center space-x-2 rounded-lg bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-300 ring-1 ring-inset ring-orange-500/20 hover:bg-orange-500/20 transition-colors">
                                <span>Low Stock</span>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-xs">
                                    {initialData.lowStockCount}
                                </span>
                            </Link>
                        )}
                        {/* --- FIX: Conditionally render the No Stock button --- */}
                        {initialData.noStockCount > 0 && (
                            <Link href="/inventory" className="flex items-center space-x-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 ring-1 ring-inset ring-red-500/20 hover:bg-red-500/20 transition-colors">
                                <span>No Stock</span>
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-xs">
                                    {initialData.noStockCount}
                                </span>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center space-x-1 p-1 bg-gray-900 rounded-lg">
                        {(['daily', 'weekly', 'monthly'] as TimeFilter[]).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                    activeFilter === filter
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:bg-gray-700/50'
                                }`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard title="Orders" value={currentData.orders.toLocaleString()} delay={0.1} />
                    <StatCard title="Revenue" value={`LKR ${currentData.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} delay={0.2} />
                    <StatCard title="Leads" value={currentData.leads.toLocaleString()} delay={0.3} />
                    <StatCard title="Conversion Rate" value={`${currentData.conversionRate.toFixed(1)}%`} delay={0.4} />
                    <StatCard title="Order Success Rate" value={`${currentData.orderSuccessRate.toFixed(1)}%`} delay={0.5} />
                    <StatCard title="Order Return Rate" value={`${currentData.orderReturnRate.toFixed(1)}%`} delay={0.6} />
                </div>
            </div>

            <ProfitSummary timeFilter={activeFilter} className="mb-6" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="rounded-lg bg-gray-800 p-6 ring-1 ring-white/10">
                <h2 className="text-lg font-medium text-white mb-4">Lead Conversion & Order Performance</h2>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
                    <div className="rounded-lg bg-gray-700/50 p-4 ring-1 ring-gray-700">
                        <div className="text-sm text-gray-400">Total Leads</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{initialData.allTime.totalLeads}</div>
                    </div>
                    <div className="rounded-lg bg-gray-700/50 p-4 ring-1 ring-gray-700">
                        <div className="text-sm text-gray-400">Converted Leads</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{initialData.allTime.convertedLeads}</div>
                    </div>
                    <div className="rounded-lg bg-gray-700/50 p-4 ring-1 ring-gray-700">
                        <div className="text-sm text-gray-400">Lead Conversion Rate</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{(initialData.allTime.conversionRate).toFixed(1)}%</div>
                    </div>
                    <div className="rounded-lg bg-gray-700/50 p-4 ring-1 ring-gray-700">
                        <div className="text-sm text-gray-400">Order Success Rate</div>
                        <div className="mt-2 text-2xl font-semibold text-green-400">{(initialData.allTime.orderSuccessRate).toFixed(1)}%</div>
                    </div>
                    <div className="rounded-lg bg-gray-700/50 p-4 ring-1 ring-gray-700">
                        <div className="text-sm text-gray-400">Order Return Rate</div>
                        <div className="mt-2 text-2xl font-semibold text-red-400">{(initialData.allTime.orderReturnRate).toFixed(1)}%</div>
                    </div>
                </div>
                
                <div className="mt-6">
                    <LeadsChart data={initialData.leadsByStatus} />
                </div>
            </motion.div>
        </div>
    );
}

function StatCard({ title, value, delay }: { title: string; value: string; delay: number }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="rounded-lg bg-gray-800 p-4 ring-1 ring-white/10">
            <div className="text-sm font-medium text-gray-400">{title}</div>
            <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
        </motion.div>
    );
}
