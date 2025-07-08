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

        // Get province_id from query params if available
        const searchParams = request.nextUrl.searchParams;
        const provinceId = searchParams.get('province_id');

        let districts;

        if (provinceId && !isNaN(Number(provinceId))) {
            // If province_id is provided, get districts for that province
            districts = await locationsAPI.getDistrictsByProvinceId(Number(provinceId));
        } else {
            // Otherwise, get all districts
            districts = await locationsAPI.getDistricts();
        }

        // Return the districts
        return NextResponse.json({ districts }, { status: 200 });
    } catch (error) {
        console.error('Error fetching districts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch districts' },
            { status: 500 }
        );
    }
} 