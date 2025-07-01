import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { LeadDetails } from '@/components/leads/lead-details';
import { Prisma } from '@prisma/client';

interface LeadDetailsPageProps {
    params: {
        leadId: string;
    };
}

interface LeadCsvData {
    name: string;
    phone: string;
    secondPhone?: string;
    email?: string | null;
    address: string;
    city: string;
    source: string;
    notes?: string;
    quantity?: number;
    discount?: number;
}

export const metadata: Metadata = {
    title: 'Lead Details',
    description: 'View and manage lead details'
};

export default async function LeadDetailsPage({ params }: LeadDetailsPageProps) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/auth/signin');
    }

    const lead = await prisma.lead.findUnique({
        where: { id: params.leadId },
        include: {
            product: true,
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            },
            order: {
                include: {
                    product: true,
                }
            }
        }
    });

    if (!lead) {
        return (
            <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500">
                <h3>Lead not found</h3>
            </div>
        );
    }

    // Check if user has access to this lead
    if (session.user.role !== 'ADMIN' && lead.assignedTo?.id !== session.user.id) {
        return (
            <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-400 ring-1 ring-red-500">
                <h3>You don't have permission to view this lead</h3>
            </div>
        );
    }

    // If lead has no assigned user, assign it to the current user
    if (!lead.assignedTo) {
        await prisma.lead.update({
            where: { id: lead.id },
            data: {
                userId: session.user.id
            }
        });
        // Refresh the lead data
        lead.assignedTo = {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email || ''
        };
    }

    // Cast the csvData to the correct type with an intermediate unknown cast
    const typedLead = {
        ...lead,
        csvData: (lead.csvData as Prisma.JsonValue as unknown) as LeadCsvData
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-100">Lead Details</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        View and manage lead information
                    </p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${lead.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-300 ring-1 ring-yellow-500/50' :
                    lead.status === 'CONFIRMED' ? 'bg-green-900/50 text-green-300 ring-1 ring-green-500/50' :
                        'bg-red-900/50 text-red-300 ring-1 ring-red-500/50'
                    }`}>
                    {lead.status.toLowerCase()}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="rounded-lg bg-gray-800 overflow-hidden ring-1 ring-gray-700">
                    <div className="px-6 py-5">
                        <LeadDetails lead={typedLead} />
                    </div>
                </div>
            </div>
        </div>
    );
} 