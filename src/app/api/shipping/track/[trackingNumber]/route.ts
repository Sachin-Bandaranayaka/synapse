import { ShippingProviderFactory } from '@/lib/shipping/factory';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { ShippingProvider } from '@prisma/client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface RouteParams {
  trackingNumber: string;
}

export async function GET(
  request: Request,
  { params }: { params: RouteParams }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find the order with this tracking number
    const order = await prisma.order.findFirst({
      where: { trackingNumber: params.trackingNumber },
      include: {
        trackingUpdates: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get the provider name from the order's shippingProvider field
    if (!order.shippingProvider) {
      return NextResponse.json(
        { error: 'Shipping provider not found' },
        { status: 404 }
      );
    }

    // Convert enum value to provider name
    const providerName = order.shippingProvider.toLowerCase().replace('_', ' ');

    // Get the shipping provider
    const provider = ShippingProviderFactory.getProvider(providerName);

    // Track the shipment
    const status = await provider.trackShipment(params.trackingNumber);

    // Update order status if needed
    if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'DELIVERED' },
      });
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to track shipment'
    }, { status: 500 });
  }
}
