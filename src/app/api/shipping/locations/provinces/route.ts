import { NextResponse } from 'next/server';
import { TransExpressProvider } from '@/lib/shipping/trans-express';
import { TransExpressLocations } from '@/lib/shipping/trans-express-locations';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get the API key from environment variables
        const apiKey = process.env.NEXT_PUBLIC_TRANS_EXPRESS_API_KEY || '';

        // Initialize the Trans Express provider
        const transExpress = new TransExpressProvider(apiKey);

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