import { getSession } from "@/lib/auth";
import { getScopedPrismaClient } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { LeadStatus } from "@prisma/client";

async function getDashboardData(tenantId: string) {
    const prisma = getScopedPrismaClient(tenantId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allLeads = await prisma.lead.findMany({ 
        select: { status: true, createdAt: true } 
    });
    
    const dailyOrders = await prisma.order.findMany({ 
        where: { createdAt: { gte: today } } 
    });

    const dailyRevenue = dailyOrders.reduce((sum, order) => sum + order.total, 0);
    const dailyLeads = allLeads.filter(l => new Date(l.createdAt) >= today).length;
    const dailyConvertedLeads = allLeads.filter(l => new Date(l.createdAt) >= today && l.status === LeadStatus.CONFIRMED).length;
    
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

    // --- PERMISSION CHECK ---
    // This page should be visible to Admins OR any user with the VIEW_DASHBOARD permission.
    if (session.user.role !== 'ADMIN' && !session.user.permissions?.includes('VIEW_DASHBOARD')) {
        return redirect('/unauthorized');
    }

    const dashboardData = await getDashboardData(session.user.tenantId);

    return <DashboardClient initialData={dashboardData} />;
}
