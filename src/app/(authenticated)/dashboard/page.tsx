// src/app/(authenticated)/dashboard/page.tsx

import { getSession } from "@/lib/auth";
import { getScopedPrismaClient } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client"; // Import our new client component
import { LeadStatus } from "@prisma/client";

// This function will fetch all necessary data securely on the server
async function getDashboardData(tenantId: string) {
    const prisma = getScopedPrismaClient(tenantId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(today.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setMonth(today.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    // Fetch data for different periods in parallel
    const [dailyOrders, weeklyOrders, monthlyOrders, allLeads] = await Promise.all([
        prisma.order.findMany({ where: { createdAt: { gte: today } } }),
        prisma.order.findMany({ where: { createdAt: { gte: weekStart } } }),
        prisma.order.findMany({ where: { createdAt: { gte: monthStart } } }),
        prisma.lead.findMany({ select: { status: true, createdAt: true } }), // Get all leads for conversion stats
    ]);

    // Calculate daily stats
    const dailyRevenue = dailyOrders.reduce((sum, order) => sum + order.total, 0);
    const dailyLeads = allLeads.filter(l => new Date(l.createdAt) >= today).length;
    const dailyConvertedLeads = allLeads.filter(l => new Date(l.createdAt) >= today && l.status === LeadStatus.CONFIRMED).length;

    // Calculate weekly stats
    const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + order.total, 0);
    const weeklyLeads = allLeads.filter(l => new Date(l.createdAt) >= weekStart).length;
    const weeklyConvertedLeads = allLeads.filter(l => new Date(l.createdAt) >= weekStart && l.status === LeadStatus.CONFIRMED).length;

    // Calculate monthly stats
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total, 0);
    const monthlyLeads = allLeads.filter(l => new Date(l.createdAt) >= monthStart).length;
    const monthlyConvertedLeads = allLeads.filter(l => new Date(l.createdAt) >= monthStart && l.status === LeadStatus.CONFIRMED).length;
    
    // Calculate all-time lead stats
    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter(l => l.status === LeadStatus.CONFIRMED).length;
    const leadsByStatus = allLeads.reduce((acc, lead) => {
        const existing = acc.find(item => item.status === lead.status);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ status: lead.status, count: 1 });
        }
        return acc;
    }, [] as { status: string; count: number }[]);

    return {
        dailyOrders: dailyOrders.length,
        dailyRevenue,
        dailyLeads,
        dailyConversionRate: dailyLeads > 0 ? (dailyConvertedLeads / dailyLeads) * 100 : 0,
        weeklyOrders: weeklyOrders.length,
        weeklyRevenue,
        weeklyLeads,
        weeklyConversionRate: weeklyLeads > 0 ? (weeklyConvertedLeads / weeklyLeads) * 100 : 0,
        monthlyOrders: monthlyOrders.length,
        monthlyRevenue,
        monthlyLeads,
        monthlyConversionRate: monthlyLeads > 0 ? (monthlyConvertedLeads / monthlyLeads) * 100 : 0,
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        leadsByStatus,
    };
}


export default async function DashboardPage() {
    const session = await getSession();

    if (!session?.user?.tenantId) {
        return redirect('/auth/signin');
    }

    // Fetch the data on the server
    const dashboardData = await getDashboardData(session.user.tenantId);

    // Render the client component with the secure data
    return <DashboardClient initialData={dashboardData} />;
}