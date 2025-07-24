import { NextRequest, NextResponse } from 'next/server';
import { TransExpressProvider } from '@/lib/shipping/trans-express';
import { TransExpressLocations } from '@/lib/shipping/trans-express-locations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

        // Get district_id from query params if available
        const searchParams = request.nextUrl.searchParams;
        const districtId = searchParams.get('district_id');

        let cities;

        if (districtId && !isNaN(Number(districtId))) {
            // If district_id is provided, get cities for that district
            cities = await locationsAPI.getCitiesByDistrictId(Number(districtId));
        } else {
            // Otherwise, get all cities
            cities = await locationsAPI.getCities();
        }

        // Return the cities
        return NextResponse.json({ cities }, { status: 200 });
    } catch (error) {
        console.error('Error fetching cities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cities' },
            { status: 500 }
        );
    }
}