// src/app/(authenticated)/leads/new/page.tsx

import { getScopedPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LeadForm } from '@/components/leads/lead-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'New Lead',
    description: 'Add a new lead to the system'
};

export default async function NewLeadPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
        return redirect('/auth/signin');
    }
    
    // Permission check for creating leads
    if (session.user.role !== 'ADMIN' && !session.user.permissions?.includes('CREATE_LEADS')) {
        return redirect('/unauthorized');
    }

    const prisma = getScopedPrismaClient(session.user.tenantId);

    // --- FIX: The query now fetches all necessary product fields ---
    const products = await prisma.product.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            name: 'asc'
        },
        // Remove the 'select' block to fetch all scalar fields,
        // including stock and lowStockAlert.
    });

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-white">New Lead</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Add a new lead to the system
                    </p>
                </div>
            </div>

            <div className="rounded-lg bg-gray-800 overflow-hidden ring-1 ring-white/10">
                <div className="px-6 py-5">
                    <LeadForm products={products} />
                </div>
            </div>
        </div>
    );
}
