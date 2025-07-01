'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SalesReport } from './sales-report';
import { ProductReport } from './product-report';
import { LeadReport } from './lead-report';
import { ShippingReport } from './shipping-report';

interface ReportTabsProps {
    initialData: {
        totalOrders: number;
        totalProducts: number;
        totalLeads: number;
        totalShipments: number;
        shippingStats: Record<string, number>;
    };
}

type TabType = 'sales' | 'products' | 'leads' | 'shipping';

export function ReportTabs({ initialData }: ReportTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('sales');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const tabs: { id: TabType; name: string; icon: JSX.Element }[] = [
        {
            id: 'sales',
            name: 'Sales Report',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
        {
            id: 'products',
            name: 'Product Report',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
        },
        {
            id: 'leads',
            name: 'Lead Report',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            id: 'shipping',
            name: 'Shipping Report',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
            ),
        },
    ];

    return (
        <div className="p-6">
            {/* Date Range Selector */}
            <div className="mb-6 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <label htmlFor="startDate" className="text-sm font-medium text-gray-400">
                        From
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="rounded-md border-gray-700 bg-gray-700 text-gray-200 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <label htmlFor="endDate" className="text-sm font-medium text-gray-400">
                        To
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="rounded-md border-gray-700 bg-gray-700 text-gray-200 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                                ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-gray-400 hover:border-gray-600 hover:text-gray-300'
                                }
                            `}
                        >
                            {tab.icon}
                            <span className="ml-2">{tab.name}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-6"
            >
                {activeTab === 'sales' && (
                    <SalesReport
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        totalOrders={initialData.totalOrders}
                    />
                )}
                {activeTab === 'products' && (
                    <ProductReport
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        totalProducts={initialData.totalProducts}
                    />
                )}
                {activeTab === 'leads' && (
                    <LeadReport
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        totalLeads={initialData.totalLeads}
                    />
                )}
                {activeTab === 'shipping' && (
                    <ShippingReport
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        totalShipments={initialData.totalShipments}
                        shippingStats={initialData.shippingStats}
                    />
                )}
            </motion.div>
        </div>
    );
} 