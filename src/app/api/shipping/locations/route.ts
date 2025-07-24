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
                transExpressApiKey: true,
            },
        });

        if (!tenant || !tenant.transExpressApiKey) {
            return NextResponse.json(
                { error: 'Trans Express API key not configured' },
                { status: 400 }
            );
        }

        // Initialize the Trans Express provider
        const transExpress = new TransExpressProvider(tenant.transExpressApiKey);

        // Initialize the locations API
        const locationsAPI = new TransExpressLocations(transExpress);

        // Fetch all data in parallel
        const [provinces, districts, cities] = await Promise.all([
            locationsAPI.getProvinces(),
            locationsAPI.getDistricts(),
            locationsAPI.getCities()
        ]);

        // Return all location data
        return NextResponse.json({
            provinces,
            districts,
            cities
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching locations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch locations data' },
            { status: 500 }
        );
    }
}