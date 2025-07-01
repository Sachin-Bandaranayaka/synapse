// src/app/(authenticated)/leads/new/page.tsx

import { getScopedPrismaClient } from '@/lib/prisma'; // Import our scoped client
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

    // 1. Secure the page and get tenantId
    if (!session?.user?.tenantId) {
        return redirect('/auth/signin');
    }

    // 2. Use the scoped client to fetch products
    const prisma = getScopedPrismaClient(session.user.tenantId);

    // 3. This query now securely fetches products for the current tenant ONLY
    const products = await prisma.product.findMany({
        orderBy: {
            name: 'asc'
        },
        select: {
            id: true,
            name: true,
            code: true,
            price: true
        }
    });

    // The rest of the component remains the same
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">New Lead</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Add a new lead to the system
                    </p>
                </div>
            </div>

            <div className="rounded-lg bg-white overflow-hidden shadow">
                <div className="px-6 py-5">
                    <LeadForm products={products} />
                </div>
            </div>
        </div>
    );
}