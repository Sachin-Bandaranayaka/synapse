import { NextResponse } from 'next/server';
import { TransExpressProvider } from '@/lib/shipping/trans-express';
import { TransExpressLocations } from '@/lib/shipping/trans-express-locations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const tenantId = session.user.tenantId;

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                transExpressUsername: true,
                transExpressPassword: true,
            },
        });

        if (!tenant || !tenant.transExpressUsername || !tenant.transExpressPassword) {
            return NextResponse.json(
                { error: 'Trans Express credentials not configured for this tenant' },
                { status: 500 }
            );
        }

        // Initialize the Trans Express provider
        const transExpress = new TransExpressProvider(tenant.transExpressUsername, tenant.transExpressPassword);

        // Initialize the locations API
        const locationsAPI = new TransExpressLocations(transExpress);

        // Fetch all provinces
        const provinces = await locationsAPI.getProvinces();

        // Return the provinces
        return NextResponse.json({ provinces }, { status: 200 });
    } catch (error) {
        console.error('Error fetching provinces:', error);
        return NextResponse.json(
            { error: 'Failed to fetch provinces' },
            { status: 500 }
        );
    }
} 