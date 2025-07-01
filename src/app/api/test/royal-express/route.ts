import { NextResponse } from 'next/server';
import { testRoyalExpressIntegration } from '@/lib/shipping/test-royal-express';

export const dynamic = 'force-dynamic'; // Make sure this is not cached

export async function GET(request: Request) {
    try {
        // Get the tenant and testShipment from the query string if provided
        const url = new URL(request.url);
        const tenant = url.searchParams.get('tenant');
        const testShipment = url.searchParams.get('testShipment') === 'true';

        // We're not using cityId and stateId for now since they don't match
        // the Royal Express city/state name requirements
        // const cityId = url.searchParams.get('cityId') ? parseInt(url.searchParams.get('cityId')!) : undefined;
        // const stateId = url.searchParams.get('stateId') ? parseInt(url.searchParams.get('stateId')!) : undefined;

        console.log('Testing Royal Express with tenant:', tenant || 'default');
        if (testShipment) {
            console.log('Including shipment creation test');
        }

        const result = await testRoyalExpressIntegration({
            tenant: tenant || undefined,
            testShipment
            // Not passing cityId or stateId as they don't map correctly
            // cityId, 
            // stateId
        });

        if (result.success) {
            return NextResponse.json({
                status: 'success',
                message: 'Royal Express (Curfox) integration is working correctly!',
                data: result.data,
                shipment: result.shipment,
                shipmentError: result.shipmentError
            });
        } else {
            return NextResponse.json({
                status: 'error',
                message: 'Royal Express (Curfox) integration test failed',
                error: result.error,
                data: null,  // Using null since userInfo is not available in the error case
                shipmentError: null
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in Royal Express test endpoint:', error);
        return NextResponse.json({
            status: 'error',
            message: 'An unexpected error occurred while testing the Royal Express integration',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 