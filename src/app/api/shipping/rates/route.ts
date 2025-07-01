import { ShippingProviderFactory } from '@/lib/shipping/factory';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ShippingAddress, PackageDetails } from '@/lib/shipping/types';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Define Zod schemas that match our TypeScript interfaces
const AddressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(1, 'Phone is required'),
}) as z.ZodType<ShippingAddress>;

const PackageSchema = z.object({
  weight: z.number().positive('Weight must be positive'),
  length: z.number().positive('Length must be positive'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
}) as z.ZodType<PackageDetails>;

const GetRatesSchema = z.object({
  origin: AddressSchema,
  destination: AddressSchema,
  packageDetails: PackageSchema,
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const data = GetRatesSchema.parse(json);

    const providers = ShippingProviderFactory.getAllProviders();
    const ratePromises = providers.map((provider) =>
      provider.getRates(data.origin, data.destination, data.packageDetails)
    );

    const allRates = await Promise.all(ratePromises);
    const rates = allRates.flat();

    return NextResponse.json(rates);
  } catch (error) {
    console.error('Shipping rates error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to get shipping rates'
    }, { status: 500 });
  }
}
