import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get date parameters from URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return new NextResponse('Start date and end date are required', { status: 400 });
    }

    // Parse and validate dates
    let startDateTime: Date;
    let endDateTime: Date;
    try {
      startDateTime = new Date(startDate);
      endDateTime = new Date(endDate);

      // Set the time to start and end of the day respectively
      startDateTime.setHours(0, 0, 0, 0);
      endDateTime.setHours(23, 59, 59, 999);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (error) {
      console.error('Date parsing error:', error);
      return new NextResponse('Invalid date format. Use YYYY-MM-DD format.', { status: 400 });
    }

    // Query all orders for order count
    const allOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDateTime,
          lte: endDateTime
        },
        status: {
          not: OrderStatus.RETURNED
        }
      }
    });

    // Query only shipped orders for revenue calculation
    const shippedOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDateTime,
          lte: endDateTime
        },
        status: OrderStatus.SHIPPED
      },
      include: {
        product: true
      }
    });

    // Calculate aggregated metrics
    const totalOrders = allOrders.length;
    const totalRevenue = shippedOrders.reduce((sum, order) => {
      // Use the order total, falling back to calculating from product price if needed
      const orderTotal = order.total || (order.quantity * order.product.price);
      return sum + orderTotal;
    }, 0);
    const averageOrderValue = shippedOrders.length > 0 ? totalRevenue / shippedOrders.length : 0;

    // Format the response
    const response = {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in sales period route:', error);
    return new NextResponse(
      'Internal Server Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      { status: 500 }
    );
  }
}