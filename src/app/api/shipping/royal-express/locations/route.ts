import { NextRequest, NextResponse } from 'next/server';
import { getAllStates, getCitiesByState, getAllCities } from '@/lib/shipping/royal-express-locations';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const state = url.searchParams.get('state');

        if (state) {
            // If a specific state is requested, return cities for that state
            const cities = await getCitiesByState(state);
            return NextResponse.json({ cities }, { status: 200 });
        } else {
            // Otherwise return all states and cities
            const [states, cities] = await Promise.all([
                getAllStates(),
                getAllCities()
            ]);
            return NextResponse.json({ states, cities }, { status: 200 });
        }
    } catch (error) {
        console.error('Error fetching Royal Express locations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch location data from Royal Express' },
            { status: 500 }
        );
    }
} 