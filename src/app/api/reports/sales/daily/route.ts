import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Get date from query parameter
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return new NextResponse('Date parameter is required', { status: 400 });
    }

    // Get start and end of the day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get all daily orders for order count
    const allOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get only SHIPPED orders for revenue calculation
    const shippedOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: OrderStatus.SHIPPED,
      },
      include: {
        product: true,
      },
    });

    // Calculate daily metrics
    const dailyOrders = allOrders.length;
    const dailyRevenue = shippedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const dailyAverageOrderValue = shippedOrders.length > 0 ? dailyRevenue / shippedOrders.length : 0;

    // Get product performance (only for shipped orders)
    const productMap = new Map();
    shippedOrders.forEach(order => {
      const product = order.product;
      const currentProduct = productMap.get(product.id) || {
        productId: product.id,
        productName: product.name,
        dailySales: 0,
        dailyRevenue: 0,
        stock: product.stock,
        quantity: 0,
        price: product.price,
      };

      currentProduct.dailySales += order.quantity;
      currentProduct.dailyRevenue += order.total || 0;
      currentProduct.quantity += order.quantity;
      productMap.set(product.id, currentProduct);
    });

    // Get revenue trend for the day (hourly breakdown) - only shipped orders
    const hourlyRevenue = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(startDate);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(startDate);
      hourEnd.setHours(hour, 59, 59, 999);

      const hourlyOrders = shippedOrders.filter(
        order =>
          order.createdAt >= hourStart && order.createdAt <= hourEnd
      );

      return {
        date: `${hour.toString().padStart(2, '0')}:00`,
        revenue: hourlyOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      };
    });

    return NextResponse.json({
      dailyOrders,
      dailyRevenue,
      dailyAverageOrderValue,
      dailyRevenueTrend: hourlyRevenue,
      products: Array.from(productMap.values()),
    });
  } catch (error) {
    console.error('Error in daily sales report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}