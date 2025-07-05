import { getScopedPrismaClient, prisma as globalPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrintClient } from './print-client'; // Import the new client component
import { Tenant } from '@prisma/client';

// This page fetches all necessary data on the server
export default async function PrintPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
        return redirect('/auth/signin');
    }

    const canPrint = session.user.role === 'ADMIN' || session.user.permissions?.includes('CREATE_ORDERS') || session.user.permissions?.includes('EDIT_ORDERS');
    if (!canPrint) {
        return redirect('/unauthorized');
    }

    const scopedPrisma = getScopedPrismaClient(session.user.tenantId);

    // Fetch both the orders and the tenant's invoice details
    const [orders, tenant] = await Promise.all([
        scopedPrisma.order.findMany({
            where: {
                // Fetching orders that are ready to be shipped or have been shipped
                status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'RETURNED'] },
            },
            include: {
                product: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        }),
        globalPrisma.tenant.findUnique({
            where: { id: session.user.tenantId }
        })
    ]);

    if (!tenant) {
        // Handle case where tenant data could not be found
        return <div>Error: Tenant information could not be loaded.</div>;
    }

    return (
        // Pass the fetched data as props to the client component
        <PrintClient 
            initialOrders={orders} 
            tenant={tenant as Tenant}
        />
    );
}
