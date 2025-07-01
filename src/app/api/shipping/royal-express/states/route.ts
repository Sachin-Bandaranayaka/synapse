import { NextResponse, NextRequest } from 'next/server';
import { RoyalExpressProvider } from '@/lib/shipping/royal-express';
import { getValidStateNames } from '@/lib/shipping/royal-express-locations';

/**
 * GET /api/shipping/royal-express/states
 * Fetch all valid states from Royal Express API
 */
export async function GET(request: NextRequest) {
    try {
        // First try using the getValidStateNames helper
        const stateNames = await getValidStateNames();

        if (stateNames && stateNames.length > 0) {
            return NextResponse.json({
                message: 'States retrieved successfully using helper function',
                states: stateNames
            });
        }

        // If that fails, try direct API call
        console.log('Helper function did not return states, trying direct API call');
        const directStates = await RoyalExpressProvider.fetchValidStates();

        if (directStates && directStates.length > 0) {
            return NextResponse.json({
                message: 'States retrieved directly from API',
                states: directStates
            });
        }

        // If both methods fail, return an error
        return NextResponse.json({
            message: 'Failed to retrieve states from Royal Express API',
            states: []
        }, { status: 500 });
    } catch (error) {
        console.error('Error retrieving Royal Express states:', error);

        return NextResponse.json({
            message: 'Error retrieving states',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 