import { Role } from '@prisma/client';
import { Metadata } from 'next';
import { getSession } from "@/lib/auth";
import { getScopedPrismaClient } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UsersClient } from './users-client';

export const metadata: Metadata = {
    title: 'Users',
    description: 'Manage users and their permissions in the system'
};

export default async function UsersPage() {
    const session = await getSession();

    // 1. Secure the page and get the tenantId
    if (!session?.user?.tenantId) {
        return redirect('/auth/signin');
    }

    // Only tenant admins can manage users
    if (session.user.role !== 'ADMIN') {
        return redirect('/unauthorized');
    }

    // 2. Use the scoped client to fetch users for the current tenant only
    const prisma = getScopedPrismaClient(session.user.tenantId);
    
    const usersData = await prisma.user.findMany({
        where: {
            // Exclude SUPER_ADMIN from the list as tenant admins cannot manage them
            role: {
                in: [Role.ADMIN, Role.TEAM_MEMBER],
            },
        },
        orderBy: {
            name: 'asc'
        },
        include: {
            _count: {
                select: {
                    orders: true,
                    leads: true,
                }
            }
        }
    });

    // 3. Transform the data to match the client component's expected format
    const users = usersData.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        totalOrders: user._count.orders,
        totalLeads: user._count.leads
    }));
    
    // 4. Render the client component with the secure data
    return <UsersClient initialUsers={users} />;
}