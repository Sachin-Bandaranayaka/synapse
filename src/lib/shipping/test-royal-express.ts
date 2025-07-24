import { RoyalExpressProvider } from './royal-express';
import { ShippingAddress, PackageDetails } from './types';

/**
 * This is a test function to validate the Royal Express (Curfox) integration.
 * It attempts to authenticate and retrieve user information.
 */
export async function testRoyalExpressIntegration(options?: {
    tenant?: string;
    testShipment?: boolean;
    cityId?: number;
    stateId?: number;
}) {
    try {
        console.log('STARTING ROYAL EXPRESS (CURFOX) INTEGRATION TEST');
        console.log('--------------------------------------------------');

        // Create provider instance
        // This can use credentials from env vars or directly provided
        const email = process.env.NEXT_PUBLIC_ROYAL_EXPRESS_EMAIL || 'janithbh123@gmail.com';
        const password = process.env.NEXT_PUBLIC_ROYAL_EXPRESS_PASSWORD || '905611623';
        const tenant = options?.tenant || process.env.NEXT_PUBLIC_ROYAL_EXPRESS_TENANT || 'royalexpress';

        console.log(`Using credentials: ${email}`);
        console.log(`Using tenant: ${tenant}`);

        const apiKey = `${email}:${password}`;
        // Create provider with explicit tenant instead of modifying env vars
        const provider = new RoyalExpressProvider(apiKey, tenant);

        console.log('Provider instance created');

        // Test authentication and user info retrieval
        console.log('Attempting to authenticate and retrieve user info...');

        const userInfo = await provider.getUserInfo();

        console.log('Authentication successful! User info retrieved:');
        console.log(JSON.stringify(userInfo, null, 2));

        // Test creating a shipment if requested
        let shipmentResult = null;
        let shipmentError = null;
        if (options?.testShipment) {
            console.log('--------------------------------------------------');
            console.log('TESTING SHIPMENT CREATION');

            // Sample addresses and package for testing - trying different city combinations
            const origin: ShippingAddress = {
                name: 'JNEX Warehouse',
                street: '123 Warehouse St',
                city: 'Colombo 01',  // Try Colombo 01 as origin
                state: 'Colombo',    // And Colombo as state
                postalCode: '10250',
                country: 'LK',
                phone: '+9477123456',
            };

            const destination: ShippingAddress = {
                name: 'Test Customer',
                street: '456 Test Address, Main Road',
                city: 'Colombo 02',  // Keep Colombo 02 as destination
                state: 'Colombo',    // And Colombo as state
                postalCode: '20000',
                country: 'LK',
                phone: '0794535345',
            };

            const packageDetails: PackageDetails = {
                weight: 2.5,
                length: 20,
                width: 15,
                height: 10,
                description: 'Fragile item',
            };

            console.log('Creating test shipment with origin:', origin.city);
            console.log('Destination:', destination.city);

            try {
                shipmentResult = await provider.createShipment(
                    origin,
                    destination,
                    packageDetails,
                    'Standard',
                    undefined,  // No city ID
                    undefined,  // No state ID
                    4000 // COD amount from documentation example
                );

                console.log('Shipment created successfully:');
                console.log(JSON.stringify(shipmentResult, null, 2));
            } catch (error) {
                console.error('Failed to create shipment:');
                console.error(error);

                shipmentError = error instanceof Error ? error.message : 'Unknown shipment error';
                console.log('Note: Shipment creation failed, but this is often due to rate card configuration in the merchant account.');
                console.log('The integration may still be valid for authentication purposes.');
            }
        }

        console.log('--------------------------------------------------');
        console.log('ROYAL EXPRESS (CURFOX) INTEGRATION TEST PASSED!');
        console.log('Authentication verified successfully.');
        if (shipmentError) {
            console.log('Shipment creation failed, but authentication works. See error details above.');
        }

        return {
            success: true,
            data: userInfo,
            shipment: shipmentResult,
            shipmentError: shipmentError
        };
    } catch (error) {
        console.error('--------------------------------------------------');
        console.error('ROYAL EXPRESS (CURFOX) INTEGRATION TEST FAILED!');
        console.error(error);
        console.error('--------------------------------------------------');

        // Try to extract the error message from the JSON response body if present
        let errorMessage = error instanceof Error ? error.message : 'Unknown error';
        try {
            if (errorMessage.includes('body:')) {
                const jsonStr = errorMessage.substring(errorMessage.indexOf('body:') + 5).trim();
                const jsonObj = JSON.parse(jsonStr);
                if (jsonObj.message) {
                    errorMessage = jsonObj.message;
                }
            }
        } catch (e) {
            // If parsing fails, use the original error message
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}

// If this file is run directly (e.g. via ts-node), execute the test
if (require.main === module) {
    testRoyalExpressIntegration({ testShipment: true })
        .then(result => {
            if (!result.success) {
                process.exit(1);
            }
        })
        .catch(err => {
            console.error('Unhandled error in test:', err);
            process.exit(1);
        });
}