// src/app/(authenticated)/reports/page.tsx

import { getScopedPrismaClient } from '@/lib/prisma'; // Import our scoped client
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReportTabs } from '@/components/reports/report-tabs';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Reports',
    description: 'View and analyze your business performance'
};

export default async function ReportsPage() {
    const session = await getServerSession(authOptions);

    // 1. Secure the page and get the tenantId
    if (!session?.user?.tenantId) {
        return redirect('/auth/signin');
    }
    // Only admins can view reports
    if (session.user.role !== 'ADMIN') {
        return redirect('/unauthorized');
    }

    // 2. Use the scoped client for all queries
    const prisma = getScopedPrismaClient(session.user.tenantId);

    // 3. These queries are now SECURE. They only count data for the current tenant.
    const [totalOrders, totalProducts, totalLeads, totalShipments] = await Promise.all([
        prisma.order.count(),
        prisma.product.count(),
        prisma.lead.count(),
        prisma.order.count({
            where: {
                shippingProvider: { not: null },
                trackingNumber: { not: null }
            }
        })
    ]);

    // 4. This groupBy query is also SECURE.
    const shippingStats = await prisma.order.groupBy({
        by: ['shippingProvider'],
        where: {
            shippingProvider: { not: null }
        },
        _count: true
    });

    const transformedShippingStats = shippingStats.reduce((acc, stat) => {
        if (stat.shippingProvider) {
            acc[stat.shippingProvider] = stat._count;
        }
        return acc;
    }, {} as Record<string, number>);

    // The UI remains the same, just with corrected colors for light mode
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                <p className="mt-2 text-sm text-gray-600">
                    View and analyze your business performance
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white rounded-lg p-6 shadow">
                    <div className="text-sm font-medium text-gray-500">Total Orders</div>
                    <div className="mt-2 text-3xl font-semibold text-gray-900">{totalOrders}</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow">
                    <div className="text-sm font-medium text-gray-500">Active Products</div>
                    <div className="mt-2 text-3xl font-semibold text-gray-900">{totalProducts}</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow">
                    <div className="text-sm font-medium text-gray-500">Total Leads</div>
                    <div className="mt-2 text-3xl font-semibold text-gray-900">{totalLeads}</div>
                </div>
                <div className="bg-white rounded-lg p-6 shadow">
                    <div className="text-sm font-medium text-gray-500">Total Shipments</div>
                    <div className="mt-2 text-3xl font-semibold text-gray-900">{totalShipments}</div>
                </div>
            </div>

            {/* Report Tabs */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <ReportTabs
                    initialData={{
                        totalOrders,
                        totalProducts,
                        totalLeads,
                        totalShipments,
                        shippingStats: transformedShippingStats
                    }}
                />
            </div>
        </div>
    );
}